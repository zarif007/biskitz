import { Fragment, MessageRole, MessageType } from '@/generated/prisma'
import IContext from '@/types/context'
import { JsonValue } from '@prisma/client/runtime/library'

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

interface FileObject {
  [path: string]: string
}

interface ConversionOptions {
  excludeTypes?: string[]
  includeRoles?: MessageRole[]
  includeFragmentFiles?: boolean
  fragmentFormat?: 'inline' | 'summary' | 'paths-only'
  maxFileContentLength?: number
}

const formatFragmentFiles = (
  files: JsonValue,
  format: 'inline' | 'summary' | 'paths-only' = 'inline',
  maxLength?: number
): string => {
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    return ''
  }

  const fileObj = files as FileObject
  const filePaths = Object.keys(fileObj)

  if (filePaths.length === 0) return ''

  switch (format) {
    case 'paths-only':
      return `\n\n[Previously generated files: ${filePaths.join(', ')}]`

    case 'summary':
      return `\n\n[Previously generated ${
        filePaths.length
      } file(s): ${filePaths.join(', ')}]`

    case 'inline':
    default:
      const fileContents = filePaths
        .map((path) => {
          let content = fileObj[path]
          if (maxLength && content.length > maxLength) {
            content = content.substring(0, maxLength) + '\n... (truncated)'
          }
          return `<file path="${path}">\n${content}\n</file>`
        })
        .join('\n\n')

      return `\n\n<previously_generated_files>\n${fileContents}\n</previously_generated_files>`
  }
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
    Object.keys(context.agents).forEach((agent) => {
      const agentRole = agent as MessageRole
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
