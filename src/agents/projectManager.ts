'use server'

import PM_AGENT from '@/constants/systemPrompts/pm'
import { ChatOpenAI } from '@langchain/openai'
import { START, END, StateGraph, Annotation } from '@langchain/langgraph'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

interface LLMConversation {
  type: string
  role: string
  content: string
}

const ProjectManagerResponseSchema = z.object({
  state: z
    .enum(['ANALYSIS', 'DESIGN', 'CODE'])
    .describe(
      'The project phase that needs attention: ANALYSIS for requirement changes, DESIGN for architecture changes, CODE for implementation changes'
    ),
  text: z
    .string()
    .describe(
      'Detailed explanation of what needs to be done and why this state was chosen'
    ),
})

type ProjectManagerResponse = z.infer<typeof ProjectManagerResponseSchema> & {
  time_taken_seconds: number
  input_tokens: number
  output_tokens: number
}

const StateAnnotation = Annotation.Root({
  conversation: Annotation<LLMConversation[]>(),
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
})

const projectManager = async (
  conversation: LLMConversation[],
  model: string = 'gpt-4o'
): Promise<ProjectManagerResponse> => {
  const startTime = Date.now()

  try {
    const llm = new ChatOpenAI({
      modelName: model,
    })

    const analyzeNode = async (state: typeof StateAnnotation.State) => {
      const conversationContext = state.conversation
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n')

      const fullMessages = [
        new SystemMessage(PM_AGENT),
        new HumanMessage(`Conversation History:
${conversationContext}

Based on the conversation above, determine the current project state and provide guidance.`),
      ]

      // Use invoke and track tokens via callbacks
      let inputTokens = 0
      let outputTokens = 0

      const llmWithStructuredOutput = llm.withStructuredOutput(
        ProjectManagerResponseSchema
      )

      const response = await llmWithStructuredOutput.invoke(fullMessages, {
        callbacks: [
          {
            handleLLMEnd(output) {
              const usage = output.llmOutput?.tokenUsage
              if (usage) {
                inputTokens = usage.promptTokens || 0
                outputTokens = usage.completionTokens || 0
              }
            },
          },
        ],
      })

      return {
        result: response,
        inputTokens,
        outputTokens,
      }
    }

    const workflow = new StateGraph(StateAnnotation)
      .addNode('analyze', analyzeNode)
      .addEdge(START, 'analyze')
      .addEdge('analyze', END)

    const app = workflow.compile()

    const result = await app.invoke({
      conversation,
    })

    const endTime = Date.now()
    const timeTakenSeconds = (endTime - startTime) / 1000

    if (!result.result) {
      throw new Error('No result generated')
    }

    return {
      ...result.result,
      time_taken_seconds: timeTakenSeconds,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
    }
  } catch (error) {
    console.error('Error in projectManager:', error)

    const endTime = Date.now()
    const timeTakenSeconds = (endTime - startTime) / 1000

    return {
      state: 'ANALYSIS',
      text: 'An error occurred while analyzing the project. Please provide more details about what you want to build.',
      time_taken_seconds: timeTakenSeconds,
      input_tokens: 0,
      output_tokens: 0,
    }
  }
}

export default projectManager
