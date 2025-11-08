import {
  Fragment,
  FragmentType,
  MessageRole,
  MessageType,
} from '@/generated/prisma'
import IContext from '@/types/context'

export interface Message {
  role: MessageRole
  content: string
  createdAt: Date
  fragment: Fragment | null
  events?: string[]
  type: MessageType
  id?: string
  inputTokens: number
  outputTokens: number
  model: string
  state: string
  timeTaken?: number
}

export interface MessageContainerProps {
  messages: Message[]
  isMessageCreationPending: boolean
  onCreateMessage: (msg: {
    content: string
    role: MessageRole
    timeTaken: number
    inputTokens: number
    outputTokens: number
    model: string
    state: string
    fragment?: {
      type: FragmentType
      title: string
      files: Record<string, string>
    }
    events?: string[]
  }) => void
  activeFragment: Fragment | null
  onFragmentClicked: (fragment: Fragment | null) => void
  headerTitle?: string
  tddEnabled: boolean
  showUsage: boolean
  setShowUsage: React.Dispatch<React.SetStateAction<boolean>>
  projectId: string
  onProjectUpdated?: () => void
  projectContext: IContext
}
