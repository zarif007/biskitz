import { Fragment, MessageRole, MessageType } from '@/generated/prisma'
import IContext from '@/types/context'

interface LLMConversation {
  type: string
  role: string
  content: string
}

interface Message {
  role: MessageRole
  content: string
  createdAt: Date
  fragment: Fragment | null
  type: MessageType
  id?: string
  totalTokens?: number
  timeTaken?: number
}

interface ConversionOptions {
  excludeTypes?: string[]
  includeRoles?: MessageRole[]
  includeFragmentFiles?: boolean
  fragmentFormat?: 'inline' | 'summary' | 'paths-only'
  maxFileContentLength?: number
  rolesToTake?: MessageRole[]
}

const convertToLines = (context: IContext, agent: MessageRole): string => {
  let lines = 'Context from agent ' + agent + ':\n'

  const agentData = context.agents?.[agent]
  if (!agentData) return lines

  lines += agentData.text + '\n\n'

  Object.keys(agentData.files).forEach((fileName) => {
    lines += `From File ${fileName}:\n`

    const file = agentData.files[fileName]
    for (let i = 0; i < file.mergedLines.length; i++) {
      lines += `[${file.lineStatus[i]}] ${file.mergedLines[i]}\n`
    }
  })

  return lines
}

const convertToOpenAIFormatWithFilter = (
  context: IContext,
  options?: ConversionOptions
): LLMConversation[] => {
  const msg: LLMConversation[] = []

  // 0️⃣ Add context name and summary as the first message
  if (context.name) {
    msg.push({
      type: 'text',
      role: 'assistant',
      content: `Project: ${context.name}\nSummary: ${
        context.summary || 'No summary provided.'
      }`,
    })
  }

  // 1️⃣ Add context from agents if it exists
  if (context.agents && Object.keys(context.agents).length > 0) {
    const rolesToTake = options?.rolesToTake

    Object.keys(context.agents).forEach((agent) => {
      const agentRole = agent as MessageRole

      // Skip this agent if rolesToTake is specified and doesn't include this role
      if (
        rolesToTake &&
        rolesToTake.length > 0 &&
        !rolesToTake.includes(agentRole)
      ) {
        return
      }

      const contextLines = convertToLines(context, agentRole)
      msg.push({
        type: 'text',
        role: agentRole === MessageRole.USER ? 'user' : 'assistant',
        content: contextLines,
      })
    })
  }

  return msg
}

export default convertToOpenAIFormatWithFilter
export type { ConversionOptions, LLMConversation, Message }
