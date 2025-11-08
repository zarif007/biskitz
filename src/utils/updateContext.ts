import IContext from '@/types/context'
import fileDiff from './fileDiff'
import { MessageRole } from '@/generated/prisma'

const updateContext = (
  projectId: string,
  text: string,
  role: MessageRole,
  files: Record<string, string>,
  currentContext: IContext
) => {
  const agents = currentContext.agents || {}
  const prevAgentData = agents[role] || { text: '', files: {} }

  const mergedFiles =
    Object.keys(prevAgentData.files).length > 0
      ? fileDiff(prevAgentData.files, files)
      : Object.fromEntries(
          Object.entries(files).map(([path, content]) => [
            path,
            {
              mergedLines: content.split('\n'),
              lineStatus: content.split('\n').map(() => '+'),
            },
          ])
        )

  const updatedContext: IContext = {
    ...currentContext,
    agents: {
      ...agents,
      [role]: {
        text,
        files: mergedFiles,
      },
    },
  }

  return updatedContext
}

export default updateContext
