import React, { useEffect, useRef, useState, useMemo, use } from 'react'
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
import { runTestsInWebContainer } from '@/utils/runTestsInWebContainer'
import convertToOpenAIFormatWithFilter from '@/utils/convertToAIFormat'
import ModelSelector from '@/components/ModelSelector'
import modelMapper from '@/utils/modelMapper'
import projectManager from '@/agents/projectManager'
import IContext from '@/types/context'
import fileDiff from '@/utils/fileDiff'

interface Message {
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

interface Props {
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
}

const MessageContainer = ({
  messages,
  activeFragment,
  onFragmentClicked,
  isMessageCreationPending,
  onCreateMessage,
  headerTitle = 'Conversation',
  tddEnabled,
  showUsage,
  setShowUsage,
  projectId,
  onProjectUpdated,
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
  const [mergedFiles, setMergedFiles] = useState<{ [path: string]: string }>({})
  const hasProcessedInitialMessage = useRef(false)
  const [modelType, setModelType] = useState<'HIGH' | 'MID'>('MID')
  const [context, setContext] = useState<IContext>({} as IContext)

  useEffect(() => {
    const lastDevMsg = [...messages]
      .reverse()
      .find((m) => m.role === MessageRole.DEVELOPER)
    if (lastDevMsg?.fragment?.files) {
      setMergedFiles({
        ...(lastDevMsg.fragment.files as { [path: string]: string }),
      })
    }
  }, [messages])

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

    const lastUserMessage = messages.findLast(
      (m) => m.role === MessageRole.USER
    )

    setModelType(() => lastUserMessage?.model as 'HIGH' | 'MID')

    if (lastAssistantMessage?.fragment) {
      onFragmentClicked(lastAssistantMessage.fragment)
    }
  }, [messages])

  const updateContext = (role: MessageRole, files: Record<string, string>) => {
    const agents = context.agents || {}
    const prevFiles = agents[role] || {}

    const mergedFiles =
      Object.keys(prevFiles).length > 0
        ? fileDiff(prevFiles, files)
        : Object.fromEntries(
            Object.entries(files).map(([path, content]) => [
              path,
              {
                mergedLines: content.split('\n'),
                lineStatus: content.split('\n').map(() => '|'),
              },
            ])
          )

    const updatedContext = {
      ...context,
      agents: {
        ...agents,
        [role]: mergedFiles,
      },
    }
    setContext(updatedContext)

    return updatedContext
  }

  const updateContextFromPM = (name: string, summary: string) => {
    const updatedContext = {
      ...context,
      projectName: name,
      projectSummary: summary,
    }
    setContext(updatedContext)
    return updatedContext
  }

  function getNextAgent(role: string, state: string): string {
    if (role === 'USER') {
      if (state === 'INIT' || state === 'REVISE') return 'PROJECT_MANAGER'
    } else if (role === 'PROJECT_MANAGER') {
      if (state === 'ANALYSIS') return 'BUSINESS_ANALYST'
      if (state === 'DESIGN') return 'SYSTEM_ARCHITECT'
      if (state === 'CODE') return 'DEVELOPER'
      if (state === 'TEST') return 'TESTER'
      if (state === 'REVIEW') return 'SECURITY_ENGINEER'
      if (state === 'DEPLOY') return 'DEVOPS'
    } else if (role === 'BUSINESS_ANALYST') {
      if (state === 'DESIGN') return 'SYSTEM_ARCHITECT'
    } else if (role === 'SYSTEM_ARCHITECT') {
      if (state === 'TEST') return 'TESTER'
      if (state === 'CODE') return 'DEVELOPER'
    } else if (role === 'TESTER') {
      if (state === 'CODE') return 'DEVELOPER'
    } else if (role === 'DEVELOPER') {
      if (state === 'RETEST') return 'TESTER'
      if (state === 'REVIEW') return 'SECURITY_ENGINEER'
    } else if (role === 'SECURITY_ENGINEER') {
      if (state === 'DEPLOY') return 'DEVOPS'
    }

    return 'Invalid role or state'
  }

  // Auto handler runner (replaces if/else chain)
  const processNextStep = async (lastMessage: Message) => {
    if (!lastMessage) return

    const nextAgent = getNextAgent(lastMessage.role, lastMessage.state)

    switch (nextAgent) {
      case 'PROJECT_MANAGER':
        await handlePM(lastMessage.content, lastMessage.state)
        break

      case 'BUSINESS_ANALYST':
        await handleBusinessAnalyst(lastMessage.content)
        break

      case 'SYSTEM_ARCHITECT':
        await handleSystemArchitect(lastMessage.content)
        break

      case 'TESTER':
        await handleTester(lastMessage.content)
        break

      case 'DEVELOPER':
        await handleDev(lastMessage.content)
        break

      // case 'SECURITY_ENGINEER':
      //   handleSE(lastMessage.content)
      //   break

      // case 'DEVOPS':
      //   testCode(lastMessage.fragment?.files || {})
      //   break

      default:
        console.warn('No valid handler for next agent:', nextAgent)
        return
    }
  }

  useEffect(() => {
    if (hasProcessedInitialMessage.current) return
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) return

    // USER => INIT/REVISE => PM
    // PM => INIT/ANALYSIS => BA, DESIGN => SA, CODE => DEV, TEST => TESTER, REVIEW => SE, DEPLOY => DEVOPS
    // BA => DESIGN => SA
    // SA => TEST (TDD) => TESTER, CODE => DEV
    // TESTER => CODE => DEV
    // DEV => RETEST (TDD) => TESTER, REVIEW => SE
    // SE => DEPLOY => DEVOPS

    processNextStep(lastMessage)
    hasProcessedInitialMessage.current = true
  }, [])

  const testCode = async (files: { [path: string]: string }) => {
    if (!tddEnabled) return
    console.log(
      '--------!!!--------',
      await runTestsInWebContainer({
        files: { ...files },
      })
    )
  }

  const buildPromptWithHistory = async (newPrompt: string, role: string) => {
    const relevantMessages = await convertToOpenAIFormatWithFilter(
      messages,
      context
    )

    return [...relevantMessages, { type: 'text', role, content: newPrompt }]
  }

  const handlePM = async (prompt: string, state: string) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.PROJECT_MANAGER)
      const projectManagerRes = await projectManager(
        projectId,
        state as 'INIT' | 'REVISE',
        await buildPromptWithHistory(prompt, 'assistant'),
        modelMapper(modelType, 'THINK')
      )

      if (state === 'INIT') {
        onProjectUpdated?.()
        updateContextFromPM(
          projectManagerRes.name ?? '',
          projectManagerRes.summary ?? ''
        )
      }
      const message = {
        content: projectManagerRes.text,
        role: MessageRole.PROJECT_MANAGER,
        timeTaken: projectManagerRes.time_taken_seconds,
        inputTokens: projectManagerRes.input_tokens,
        outputTokens: projectManagerRes.output_tokens,
        model: modelMapper(modelType, 'THINK'),
        state: projectManagerRes.state,
        events: [] as string[],
      }
      if (projectManagerRes.name) {
        message['events'] = [
          `Updated project name to "${projectManagerRes.name}"`,
          `Updated project summary`,
        ]
      }
      onCreateMessage(message)
      if (projectManagerRes.input_tokens > 0)
        await processNextStep(message as Message)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBusinessAnalyst = async (prompt: string) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.BUSINESS_ANALYST)
      const businessAnalystRes = await businessAnalyst(
        await buildPromptWithHistory(prompt, 'assistant'),
        modelMapper(modelType, 'THINK')
      )
      const files = { ['Analysis Report']: businessAnalystRes.response ?? '' }
      onCreateMessage({
        content:
          '@sys_arch here’s the requirement. Design the system architecture and define the key modules.',
        role: MessageRole.BUSINESS_ANALYST,
        timeTaken: businessAnalystRes.time_taken_seconds,
        inputTokens: businessAnalystRes.tokens.input_tokens,
        outputTokens: businessAnalystRes.tokens.output_tokens,
        model: modelMapper(modelType, 'THINK'),
        state: 'DESIGN',
        fragment: {
          type: FragmentType.DOC,
          files,
          title: 'Analysis Report',
        },
      })
      updateContext(MessageRole.BUSINESS_ANALYST, files)
      if (businessAnalystRes.response)
        await handleSystemArchitect(businessAnalystRes.response)
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
      const systemArchitectRes = await systemArchitect(
        await buildPromptWithHistory(prompt, 'assistant'),
        modelMapper(modelType, 'THINK')
      )
      const files = {
        ['System Architecture']: systemArchitectRes.response ?? '',
      }
      onCreateMessage({
        content:
          '@dev here’s the system design. Implement it as a complete NPM package.',
        role: MessageRole.SYSTEM_ARCHITECT,
        timeTaken: systemArchitectRes.time_taken_seconds,
        inputTokens: systemArchitectRes.tokens.input_tokens,
        outputTokens: systemArchitectRes.tokens.output_tokens,
        model: modelMapper(modelType, 'THINK'),
        state: tddEnabled ? 'TEST' : 'CODE',
        fragment: {
          type: FragmentType.DOC,
          files,
          title: 'System Architecture',
        },
      })
      updateContext(MessageRole.SYSTEM_ARCHITECT, files)
      console.log(MessageRole.SYSTEM_ARCHITECT, context)
      if (systemArchitectRes.response)
        await handleTester(systemArchitectRes.response)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTester = async (prompt: string) => {
    try {
      if (tddEnabled) {
        setIsProcessing(true)
        setNextFrom(MessageRole.TESTER)
        const testerRes = await tester(prompt)
        onCreateMessage({
          content: '',
          role: MessageRole.TESTER,
          timeTaken: 0,
          inputTokens: 0,
          outputTokens: 0,
          model: '',
          state: 'CODE',
          fragment: {
            type: FragmentType.CODE,
            files: testerRes?.state.files ?? {},
            title: 'Code',
          },
        })
        if (testerRes) await handleDev(prompt)
      } else {
        await handleDev(prompt)
      }
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDev = async (prompt: string) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.DEVELOPER)
      const devRes = await developer(
        await buildPromptWithHistory(prompt, 'assistant'),
        mergedFiles,
        tddEnabled,
        modelMapper(modelType, 'DEV')
      )

      const newFiles = devRes?.state.files ?? {}
      const updatedFiles = { ...mergedFiles, ...newFiles }

      setMergedFiles(updatedFiles)

      onCreateMessage({
        content:
          '@security_engineer code is ready. Review for security issues and vulnerabilities.',
        role: MessageRole.DEVELOPER,
        timeTaken: devRes.time_taken_seconds,
        inputTokens: devRes.tokens.input_tokens,
        outputTokens: devRes.tokens.output_tokens,
        model: modelMapper(modelType, 'DEV'),
        state: tddEnabled ? 'RETEST' : 'REVIEW',
        fragment: {
          type: FragmentType.CODE,
          files: updatedFiles,
          title: 'Code',
        },
      })

      await testCode(updatedFiles)
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
      timeTaken: 0,
      inputTokens: 0,
      outputTokens: 0,
      model: modelType,
      state: 'REVISE',
    })
    handlePM(messageContent, 'REVISE')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
      {/* Header */}
      <div className="h-10 flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center gap-3 h-full">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Go back</span>
            </Button>
          </Link>
          <h2 className="font-semibold text-gray-950 dark:text-gray-100 text-sm leading-none">
            {headerTitle}
          </h2>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Button
                variant="default"
                className="text-xs cursor-pointer h-7"
                onClick={() => setShowUsage(!showUsage)}
              >
                {showUsage ? 'Hide' : 'Usage'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-black mb-4">
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
                                {message.content
                                  .split(/(@\S+)/g)
                                  .map((part, index) =>
                                    part.startsWith('@') ? (
                                      <span
                                        key={index}
                                        className="text-blue-600 font-medium"
                                      >
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
                        {message.events && message.events.length > 0 && (
                          <div className="mt-0 space-y-1">
                            {message.events.map((event) => (
                              <p className="text-xs w-full p-[6] bg-transparent text-gray-700 dark:text-gray-300 underline">
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
              })
            )}
            {isProcessing && <MessageLoader type={nextFrom} />}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full resize-none text-sm min-h-[80px] max-h-[120px] bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-700 rounded-sm focus:ring-0"
              disabled={isProcessing}
            />

            <div className="absolute left-2 bottom-2 flex items-center">
              <ModelSelector
                setModelType={setModelType}
                disabled={isProcessing}
                defaultValue={modelType}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={!inputValue || isProcessing}
              size="sm"
              className="absolute right-2 bottom-2 h-8 px-2 bg-black hover:bg-gray-900 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-950 rounded-sm"
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
