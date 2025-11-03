import { MessageRole } from '@/generated/prisma'

interface IContext {
  name: string
  summary: string
  version: number
  agents: Record<MessageRole, Record<string, string>>
}

export default IContext
