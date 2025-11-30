import React, { useEffect, useRef, useState } from 'react'
import { FragmentType, MessageRole } from '@/generated/prisma'
import businessAnalyst from '@/agents/businessAnalyst'
import systemArchitect from '@/agents/systemArchitect'
import developer from '@/agents/developer'
import tester from '@/agents/tester'
import { runTestsInWebContainer } from '@/utils/runTestsInWebContainer'
import convertToOpenAIFormatWithFilter from '@/utils/convertToAIFormat'
import modelMapper from '@/utils/modelMapper'
import projectManager from '@/agents/projectManager'
import IContext from '@/types/context'
import MessageHeader from './messageContainer/MessageHeader'
import MessageList from './messageContainer/MessageList'
import MessageInput from './messageContainer/MessageInput'
import { Message, MessageContainerProps } from './messageContainer/types'
import updateContext from '@/utils/updateContext'
import { useTRPC } from '@/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

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
  projectContext,
}: MessageContainerProps) => {
  const trpc = useTRPC()
  const updateProject = useMutation(trpc.project.update.mutationOptions({}))

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
  const [context, setContext] = useState<IContext>(projectContext as IContext)

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

  const updateInfo = async (
    name: string,
    summary: string,
    currentContext: IContext
  ) => {
    const updatedContext = {
      ...currentContext,
      name,
      summary,
    }
    setContext(updatedContext)
    await updateContextToDB(updatedContext)
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

  const processNextStep = async (
    lastMessage: Message,
    currentContext: IContext
  ) => {
    if (!lastMessage) return

    const nextAgent = getNextAgent(lastMessage.role, lastMessage.state)

    switch (nextAgent) {
      case 'PROJECT_MANAGER':
        await handlePM(lastMessage.content, lastMessage.state, currentContext)
        break

      case 'BUSINESS_ANALYST':
        await handleBusinessAnalyst(lastMessage.content, currentContext)
        break

      case 'SYSTEM_ARCHITECT':
        await handleSystemArchitect(lastMessage.content, currentContext)
        break

      case 'TESTER':
        await handleTester(lastMessage.content, currentContext)
        break

      case 'DEVELOPER':
        await handleDev(lastMessage.content, currentContext)
        break

      default:
        console.warn('No valid handler for next agent:', nextAgent)
        return
    }
  }

  useEffect(() => {
    if (hasProcessedInitialMessage.current) return
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) return

    processNextStep(lastMessage, context)
    hasProcessedInitialMessage.current = true
  }, [])

  const updateContextToDB = async (updatedContext: IContext) => {
    await updateProject.mutateAsync({
      id: projectId,
      data: {
        context: JSON.stringify(updatedContext),
      },
    })
  }

  const testCode = async (files: { [path: string]: string }) => {
    if (!tddEnabled) return
    console.log(
      '--------!!!--------',
      await runTestsInWebContainer({
        files,
      })
    )
  }

  const handlePM = async (
    prompt: string,
    state: string,
    currentContext: IContext
  ) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.PROJECT_MANAGER)
      const projectManagerRes = await projectManager(
        projectId,
        state as 'INIT' | 'REVISE',
        convertToOpenAIFormatWithFilter(currentContext, {
          includeRoles: [
            MessageRole.USER,
            MessageRole.BUSINESS_ANALYST,
            MessageRole.SYSTEM_ARCHITECT,
          ],
        }),
        modelMapper(modelType, 'THINK')
      )

      let updatedInfo = currentContext
      if (state === 'INIT') {
        onProjectUpdated?.()
        updatedInfo = await updateInfo(
          projectManagerRes.name ?? '',
          projectManagerRes.summary ?? '',
          currentContext
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
      let updatedContext = updateContext(
        projectManagerRes.text,
        MessageRole.PROJECT_MANAGER,
        {},
        updatedInfo
      )
      setContext(updatedContext)
      await updateContextToDB(updatedContext)
      if (projectManagerRes.input_tokens > 0)
        await processNextStep(message as Message, updatedContext)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBusinessAnalyst = async (
    prompt: string,
    currentContext: IContext
  ) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.BUSINESS_ANALYST)
      const businessAnalystRes = await businessAnalyst(
        convertToOpenAIFormatWithFilter(currentContext, {
          includeRoles: [MessageRole.USER, MessageRole.PROJECT_MANAGER],
        }),
        modelMapper(modelType, 'THINK')
      )
      const files = { ['Analysis Report']: businessAnalystRes.response ?? '' }
      onCreateMessage({
        content: `@pm @sys_arch`,
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
      const updatedContext = updateContext(
        '',
        MessageRole.BUSINESS_ANALYST,
        files,
        currentContext
      )
      setContext(updatedContext)
      await updateContextToDB(updatedContext)
      if (businessAnalystRes.response)
        await handleSystemArchitect(businessAnalystRes.response, updatedContext)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  // Build a CLI to mimic NPM repo
  // Then deploy to NPM

  const handleSystemArchitect = async (
    prompt: string,
    currentContext: IContext,
    add: boolean = false
  ) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.SYSTEM_ARCHITECT)
      const systemArchitectRes = await systemArchitect(
        convertToOpenAIFormatWithFilter(currentContext, {
          includeRoles: [
            MessageRole.USER,
            MessageRole.PROJECT_MANAGER,
            MessageRole.BUSINESS_ANALYST,
          ],
        }),
        modelMapper(modelType, 'THINK')
      )
      const files = {
        ['System Architecture']: systemArchitectRes.response ?? '',
      }
      onCreateMessage({
        content: `@pm @dev`,
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
      const updatedContext = updateContext(
        '',
        MessageRole.SYSTEM_ARCHITECT,
        files,
        currentContext
      )
      setContext(updatedContext)
      await updateContextToDB(updatedContext)
      if (systemArchitectRes.response)
        await handleTester(systemArchitectRes.response, updatedContext)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTester = async (prompt: string, currentContext: IContext) => {
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
        if (testerRes) await handleDev(prompt, currentContext)
      } else {
        await handleDev(prompt, currentContext)
      }
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDev = async (prompt: string, currentContext: IContext) => {
    try {
      setIsProcessing(true)
      setNextFrom(MessageRole.DEVELOPER)
      const devRes = await developer(
        convertToOpenAIFormatWithFilter(currentContext, {
          includeRoles: [
            MessageRole.USER,
            MessageRole.PROJECT_MANAGER,
            MessageRole.SYSTEM_ARCHITECT,
            MessageRole.TESTER,
          ],
        }),
        mergedFiles,
        tddEnabled,
        modelMapper(modelType, 'DEV')
      )

      const newFiles = devRes?.state.files ?? {}
      const updatedFiles = { ...mergedFiles, ...newFiles }

      setMergedFiles(updatedFiles)

      onCreateMessage({
        content: tddEnabled ? '@tester' : '@security_engineer',
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

      const updatedContext = updateContext(
        '',
        MessageRole.DEVELOPER,
        updatedFiles,
        currentContext
      )
      setContext(updatedContext)
      await updateContextToDB(updatedContext)
      await testCode(updatedFiles)
    } catch (e) {
      console.error('Error generating code:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSend = async () => {
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
    const updatedContext = updateContext(
      messageContent,
      MessageRole.USER,
      {},
      context
    )
    setContext(updatedContext)
    await updateContextToDB(updatedContext)
    handlePM(messageContent, 'REVISE', updatedContext)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
      <MessageHeader
        headerTitle={headerTitle}
        showUsage={showUsage}
        setShowUsage={setShowUsage}
      />
      <MessageList
        messages={messages}
        scrollAreaRef={scrollAreaRef}
        bottomRef={bottomRef}
        activeFragment={activeFragment}
        onFragmentClicked={onFragmentClicked}
        expandedFragmentIdx={expandedFragmentIdx}
        setExpandedFragmentIdx={setExpandedFragmentIdx}
        isProcessing={isProcessing}
        nextFrom={nextFrom}
      />
      {/* <div className="h-6 border bg-white dark:bg-black justify-end items-center flex px-4">
        <Button className="tex-xs py-0 h-4">Continue</Button>
      </div> */}
      <MessageInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleKeyDown={handleKeyDown}
        handleSend={handleSend}
        isProcessing={isProcessing}
        isMessageCreationPending={isMessageCreationPending}
        modelType={modelType}
        setModelType={setModelType}
      />
    </div>
  )
}

export default MessageContainer
