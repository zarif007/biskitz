import { Card } from '@/components/ui/card'
import { MessageRole } from '@/generated/prisma'
import { Clock, User, Code2, ChevronDown, ChevronUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import AssistantAvatar from '../assistant-avatar'
import { Message } from './types'
import { Fragment } from '@/generated/prisma'

interface MessageItemProps {
  message: Message
  index: number
  isAssistant: boolean
  activeFragment: Fragment | null
  onFragmentClicked: (fragment: Fragment | null) => void
  expandedFragmentIdx: number | null
  setExpandedFragmentIdx: (idx: number | null) => void
}

const MessageItem = ({
  message,
  index,
  isAssistant,
  activeFragment,
  onFragmentClicked,
  expandedFragmentIdx,
  setExpandedFragmentIdx,
}: MessageItemProps) => {
  const { data: session } = useSession()

  return (
    <div
      key={message.id || index}
      className={`flex items-start gap-3 ${
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAssistant
              ? 'bg-gray-100 dark:bg-gray-900'
              : 'bg-black dark:bg-gray-100'
          }`}
        >
          {isAssistant ? (
            <AssistantAvatar type={message.role} />
          ) : session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white dark:text-gray-950" />
          )}
        </div>
      </div>

      <div className="flex-1 max-w-[80%]">
        <Card
          className={`shadow-none gap-2 border-0 bg-transparent ${
            isAssistant
              ? 'p-0 my-2'
              : 'bg-black dark:bg-gray-100 border-gray-950 dark:border-gray-100 p-3'
          }`}
        >
          {message.role !== MessageRole.USER && (
            <p className="text-[10px] font-semibold text-gray-500">
              {message.role}
            </p>
          )}
          {message.content && (
            <p
              className={`text-sm leading-relaxed ${
                isAssistant
                  ? 'text-gray-950 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-sm p-2'
                  : 'text-white dark:text-gray-950'
              }`}
            >
              {isAssistant && message.content.includes('@') ? (
                <>
                  {message.content.split(/(@\S+)/g).map((part, index) =>
                    part.startsWith('@') ? (
                      <span key={index} className="text-blue-600 font-medium">
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </>
              ) : (
                message.content
              )}
            </p>
          )}
          {message.fragment && (
            <div
              className={`p-2 rounded-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ${
                activeFragment && message.fragment.id === activeFragment.id
                  ? 'ring-2 ring-blue-500'
                  : ''
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  if (message.fragment) {
                    onFragmentClicked(message.fragment)
                  }
                }}
              >
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Code2 className="w-4 h-4 mr-1" />
                  {message.fragment.title}
                </div>
                <button
                  type="button"
                  className="ml-2 p-1 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={(event) => {
                    event.stopPropagation()
                    setExpandedFragmentIdx(
                      expandedFragmentIdx === index ? null : index
                    )
                  }}
                >
                  {expandedFragmentIdx === index ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
              {expandedFragmentIdx === index && message.fragment.files && (
                <div className="mt-2 mb-1 text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Files:</span>
                  <ul className="list-disc ml-4">
                    {Object.entries(
                      message.fragment.files as Record<string, unknown>
                    ).map(([file]) => (
                      <li key={file} className="break-all">
                        <span className="font-mono">{file}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {message.events && message.events.length > 0 && (
            <div className="mt-0 space-y-1">
              {message.events.map((event, eventIndex) => (
                <p
                  key={eventIndex}
                  className="text-xs w-full p-[6] bg-transparent text-gray-700 dark:text-gray-300 underline"
                >
                  {event}
                </p>
              ))}
            </div>
          )}
        </Card>

        <div
          className={`flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
            isAssistant ? 'justify-start' : 'justify-end'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MessageItem
