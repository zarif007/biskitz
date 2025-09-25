import React, { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Clock,
  User,
  Bot,
  Send,
  Code2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Fragment,
  FragmentType,
  MessageRole,
  MessageType,
} from '@/generated/prisma'
import MessageLoader from './message-loader'
import { useSession } from 'next-auth/react'
import businessAnalyst from '@/agents/businessAnalyst'
import AssistantAvatar from './assistant-avatar'
import systemArchitect from '@/agents/systemArchitect'
import Link from 'next/link'
import developer from '@/agents/developer'
import tester from '@/agents/tester'

interface Message {
  role: MessageRole
  content: string
  createdAt: Date
  fragment: Fragment | null
  type: MessageType
  id?: string
}

interface Props {
  messages: Message[]
  isMessageCreationPending: boolean
  onCreateMessage: (msg: {
    content: string
    role: MessageRole
    fragment?: {
      type: FragmentType
      title: string
      files: Record<string, string>
    }
  }) => void
  activeFragment: Fragment | null
  onFragmentClicked: (fragment: Fragment | null) => void
  headerTitle?: string
}

const MessageContainer = ({
  messages,
  activeFragment,
  onFragmentClicked,
  isMessageCreationPending,
  onCreateMessage,
  headerTitle = 'Conversation',
}: Props) => {
  const { data: session } = useSession()
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [nextFrom, setNextFrom] = useState<MessageRole>('BUSINESS_ANALYST')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [expandedFragmentIdx, setExpandedFragmentIdx] = useState<number | null>(
    null
  )
  const [currentFiles, setCurrentFile] = useState<{ [path: string]: string }>(
    {}
  )
  const hasProcessedInitialMessage = useRef(false)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    const lastAssistantMessage = messages.findLast(
      (m) => m.role !== MessageRole.USER
    )

    if (lastAssistantMessage?.fragment) {
      onFragmentClicked(lastAssistantMessage.fragment)
    }
  }, [messages])

  useEffect(() => {
    if (hasProcessedInitialMessage.current) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === MessageRole.USER) {
      handleBusinessAnalyst(lastMessage.content)
      hasProcessedInitialMessage.current = true
    } else if (lastMessage?.role === MessageRole.BUSINESS_ANALYST) {
      handleSystemArchitect(lastMessage.content)
      hasProcessedInitialMessage.current = true
    } else if (lastMessage?.role === MessageRole.SYSTEM_ARCHITECT) {
      handleTester(lastMessage.content)
      hasProcessedInitialMessage.current = true
    } else if (lastMessage?.role === MessageRole.TESTER) {
      handleDev(lastMessage.content, currentFiles)
      hasProcessedInitialMessage.current = true
    }
  }, [])

  const handleBusinessAnalyst = async (prompt: string) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.BUSINESS_ANALYST)
      const businessAnalystRes = await businessAnalyst(prompt)
      onCreateMessage({
        content: '',
        role: MessageRole.BUSINESS_ANALYST,
        fragment: {
          type: FragmentType.DOC,
          files: { ['Analysis Report']: businessAnalystRes ?? '' },
          title: 'Analysis Report',
        },
      })
      if (businessAnalystRes) await handleSystemArchitect(businessAnalystRes)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSystemArchitect = async (prompt: string) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.SYSTEM_ARCHITECT)
      const systemArchitectRes = await systemArchitect(prompt)
      onCreateMessage({
        content: '',
        role: MessageRole.SYSTEM_ARCHITECT,
        fragment: {
          type: FragmentType.DOC,
          files: { ['System Architecture']: systemArchitectRes ?? '' },
          title: 'System Architecture',
        },
      })
      if (systemArchitectRes) await handleTester(systemArchitectRes)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTester = async (prompt: string) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.TESTER)
      const testerRes = await tester(prompt)
      onCreateMessage({
        content: '',
        role: MessageRole.TESTER,
        fragment: {
          type: FragmentType.CODE,
          files: testerRes?.state.files ?? {},
          title: 'Code',
        },
      })
      setCurrentFile(() => testerRes?.state.files ?? {})
      if (testerRes) await handleDev(prompt, testerRes?.state.files ?? {})
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDev = async (
    prompt: string,
    files: { [path: string]: string }
  ) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.DEVELOPER)
      const devRes = await developer(prompt, files)

      onCreateMessage({
        content: '',
        role: MessageRole.DEVELOPER,
        fragment: {
          type: FragmentType.CODE,
          files: { ...(devRes?.state.files ?? {}), ...files },
          title: 'Code',
        },
      })
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSend = () => {
    if (!inputValue) return

    const messageContent = inputValue
    setInputValue('')
    onCreateMessage({
      content: messageContent,
      role: MessageRole.USER,
    })
    handleBusinessAnalyst(messageContent)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col border-r bg-white dark:bg-gray-950">
      <div className="flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Go back</span>
            </Button>
          </Link>
          <h2 className="font-semibold text-gray-950 dark:text-gray-100 text-sm">
            {headerTitle}
          </h2>
          <div className="flex items-center gap-1 ml-auto">
            <Badge variant="secondary" className="text-xs">
              {messages.length} messages
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-900 mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-950 dark:text-gray-100 mb-1">
                  No messages yet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Start a conversation to see messages here
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isAssistant = message.role !== MessageRole.USER

                return (
                  <div
                    key={message.id || index}
                    className={`flex gap-3 ${
                      isAssistant ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isAssistant
                            ? 'bg-gray-100 dark:bg-gray-900'
                            : 'bg-gray-950 dark:bg-gray-100'
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
                        className={`p-3 shadow-sm ${
                          isAssistant
                            ? 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700'
                            : 'bg-gray-950 dark:bg-gray-100 border-gray-950 dark:border-gray-100'
                        }`}
                      >
                        {message.content && (
                          <p
                            className={`text-sm leading-relaxed ${
                              isAssistant
                                ? 'text-gray-950 dark:text-gray-100'
                                : 'text-white dark:text-gray-950'
                            }`}
                          >
                            {message.content}
                          </p>
                        )}
                        {message.fragment && (
                          <div
                            className={`p-2 rounded-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ${
                              activeFragment &&
                              message.fragment.id === activeFragment.id
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
                            {expandedFragmentIdx === index &&
                              message.fragment.files && (
                                <div className="mt-2 mb-1 text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Files:</span>
                                  <ul className="list-disc ml-4">
                                    {Object.entries(
                                      message.fragment.files as Record<
                                        string,
                                        unknown
                                      >
                                    ).map(([file]) => (
                                      <li key={file} className="break-all">
                                        <span className="font-mono">
                                          {file}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
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
              })
            )}
            {isProcessing && <MessageLoader type={nextFrom} />}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="flex-shrink-0 sticky bottom-0 p-4 border-t bg-white dark:bg-gray-950">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full resize-none text-sm min-h-[64px] max-h-[120px] pr-12 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700 rounded-sm focus:ring-0"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue || isProcessing}
              size="sm"
              className="absolute right-2 bottom-2 h-8 px-2 bg-gray-950 hover:bg-gray-900 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-950"
            >
              {isMessageCreationPending || isProcessing ? (
                <svg
                  className="w-4 h-4 animate-spin text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageContainer
