'use server'

import PM_AGENT from '@/constants/systemPrompts/pm'
import { ChatOpenAI } from '@langchain/openai'
import { START, END, StateGraph, Annotation } from '@langchain/langgraph'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import { tool } from '@langchain/core/tools'

interface LLMConversation {
  type: string
  role: string
  content: string
}

const ProjectManagerResponseSchema = z.object({
  state: z.enum(['ANALYSIS', 'DESIGN', 'CODE']),
  text: z.string(),
})

type ProjectManagerResponse = z.infer<typeof ProjectManagerResponseSchema> & {
  time_taken_seconds: number
  input_tokens: number
  output_tokens: number
  project_updated?: boolean
  name?: string
  summary?: string
}

const StateAnnotation = Annotation.Root({
  conversation: Annotation<LLMConversation[]>(),
  projectId: Annotation<string>(),
  projectState: Annotation<'INIT' | 'REVISE'>(),
  result: Annotation<z.infer<typeof ProjectManagerResponseSchema> | null>({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  inputTokens: Annotation<number>({
    value: (x, y) => (y || 0) + (x || 0),
    default: () => 0,
  }),
  outputTokens: Annotation<number>({
    value: (x, y) => (y || 0) + (x || 0),
    default: () => 0,
  }),
  projectUpdated: Annotation<boolean>({
    value: (x, y) => y ?? x,
    default: () => false,
  }),
  name: Annotation<string | null>({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
  summary: Annotation<string | null>({
    value: (x, y) => y ?? x,
    default: () => null,
  }),
})

const updateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().min(3).max(100),
  summary: z.string().min(10).max(500),
})

const updateProjectTool = tool(
  async (input: unknown) => {
    const parsed = updateProjectSchema.parse(input)
    try {
      const { getCaller } = await import('@/trpc/server')
      const caller = await getCaller()
      await caller.project.update({
        id: parsed.projectId,
        data: { name: parsed.name, summary: parsed.summary },
      })
      return `Updated project name to "${parsed.name}" and summary to "${parsed.summary}".`
    } catch {
      return `Failed to update project.`
    }
  },
  {
    name: 'updateProject',
    description:
      'Updates the project name and summary during INIT state when there is enough context.',
    schema: updateProjectSchema,
  }
)

const projectManager = async (
  projectId: string,
  state: 'INIT' | 'REVISE',
  conversation: LLMConversation[],
  model: string = 'gpt-4o'
): Promise<ProjectManagerResponse> => {
  const startTime = Date.now()
  let name: string | null = null
  let summary: string | null = null

  try {
    const llm = new ChatOpenAI({ modelName: model })

    const analyzeNode = async (state: typeof StateAnnotation.State) => {
      const conversationContext = state.conversation
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n')

      const systemPrompt =
        state.projectState === 'INIT'
          ? `${PM_AGENT}

Since this is INIT state:
1. Analyze requirements
2. Use updateProject tool if possible to set project name (for a NPM package) and summary
3. Then explain project state`
          : PM_AGENT

      const fullMessages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Conversation History:
${conversationContext}

Project ID: ${state.projectId}
Current State: ${state.projectState}`),
      ]

      let inputTokens = 0
      let outputTokens = 0
      let projectUpdated = false
      let updatedName: string | null = null
      let updatedSummary: string | null = null

      const llmWithTools = llm.bindTools([updateProjectTool])
      const response = await llmWithTools.invoke(fullMessages, {
        callbacks: [
          {
            handleLLMEnd(output) {
              const usage = output.llmOutput?.tokenUsage
              if (usage) {
                inputTokens += usage.promptTokens || 0
                outputTokens += usage.completionTokens || 0
              }
            },
          },
        ],
      })

      if (
        state.projectState === 'INIT' &&
        response.tool_calls &&
        response.tool_calls.length > 0
      ) {
        for (const toolCall of response.tool_calls) {
          if (toolCall.name === 'updateProject') {
            const toolResult = await updateProjectTool.invoke({
              ...toolCall.args,
              projectId: state.projectId,
            })
            projectUpdated = toolResult.includes('Updated')
            const nameMatch = toolResult.match(
              /Updated project name to "(.*?)"/
            )
            if (nameMatch) updatedName = nameMatch[1]
            const summaryMatch = toolResult.match(/summary to "(.*?)"\./)
            if (summaryMatch) updatedSummary = summaryMatch[1]
          }
        }
      }

      const llmWithStructuredOutput = llm.withStructuredOutput(
        ProjectManagerResponseSchema
      )
      const structuredResponse = await llmWithStructuredOutput.invoke(
        fullMessages,
        {
          callbacks: [
            {
              handleLLMEnd(output) {
                const usage = output.llmOutput?.tokenUsage
                if (usage) {
                  inputTokens += usage.promptTokens || 0
                  outputTokens += usage.completionTokens || 0
                }
              },
            },
          ],
        }
      )

      return {
        result: structuredResponse,
        inputTokens,
        outputTokens,
        projectUpdated,
        name: updatedName,
        summary: updatedSummary,
      }
    }

    const workflow = new StateGraph(StateAnnotation)
      .addNode('analyze', analyzeNode)
      .addEdge(START, 'analyze')
      .addEdge('analyze', END)

    const app = workflow.compile()

    const result = await app.invoke({
      conversation,
      projectId,
      projectState: state,
    })

    if (result.name) name = result.name
    if (result.summary) summary = result.summary

    const endTime = Date.now()
    const timeTakenSeconds = (endTime - startTime) / 1000

    if (!result.result) throw new Error('No result generated')

    return {
      ...result.result,
      time_taken_seconds: timeTakenSeconds,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      project_updated: result.projectUpdated,
      name: name || undefined,
      summary: summary || undefined,
    }
  } catch (error) {
    const endTime = Date.now()
    const timeTakenSeconds = (endTime - startTime) / 1000
    return {
      state: 'ANALYSIS',
      text: 'An error occurred while analyzing the project.',
      time_taken_seconds: timeTakenSeconds,
      input_tokens: 0,
      output_tokens: 0,
      project_updated: false,
      name: name || undefined,
      summary: summary || undefined,
    }
  }
}

export default projectManager
