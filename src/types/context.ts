import { MessageRole } from '@/generated/prisma'

interface AgentFile {
  lineStatus: string[]
  mergedLines: string[]
}

interface AgentData {
  text: string
  files: Record<string, AgentFile>
}

interface IContext {
  name: string
  summary: string
  version: number
  agents: Record<MessageRole, AgentData>
}

export default IContext
