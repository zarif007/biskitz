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

const convertToOpenAIFormatWithFilter = (
  messages: Message[],
  context: IContext,
  options?: ConversionOptions
): LLMConversation[] => {
  console.log(context)
  let filtered = messages

  if (options?.excludeTypes) {
    filtered = filtered.filter(
      (msg) => !options.excludeTypes!.includes(msg.type)
    )
  }

  if (options?.includeRoles) {
    filtered = filtered.filter((msg) =>
      options.includeRoles!.includes(msg.role)
    )
  }

  return filtered.map((msg) => {
    let content = msg.content

    if (msg.fragment?.files) {
      const fragmentContent = formatFragmentFiles(
        msg.fragment.files,
        options?.fragmentFormat ?? 'inline',
        options?.maxFileContentLength
      )
      content += fragmentContent
    }

    return {
      type: 'text',
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content,
    }
  })
}

export default convertToOpenAIFormatWithFilter
export type { ConversionOptions, LLMConversation, Message }
