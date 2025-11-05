'use client'

import { useTRPC } from '@/trpc/client'
import React, { Suspense, useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { Fragment, FragmentType, MessageRole } from '@/generated/prisma'
import FileExplorer from '@/components/FileExplorer'
import DocView from '../components/doc-view'
import Usage from '../components/usage'
import MessageContainer from '../components/MessageContainer'

interface Props {
  projectId: string
}

export const ProjectView = ({ projectId }: Props) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null)
  const [showUsage, setShowUsage] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({ projectId })
  )

  const { data: project, isError } = useSuspenseQuery(
    trpc.project.getOne.queryOptions({ id: projectId })
  )

  useEffect(() => {
    if (isError || !project) {
      router.push('/404')
    }
  }, [isError, project, router])

  useEffect(() => {
    if (
      project &&
      session?.user?.email &&
      project.user.email !== session.user.email
    ) {
      router.push('/')
    }
  }, [project, session, router])

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onError: (error) => {
        console.error('Error creating message:', error)
      },
      onSettled: () => {
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        )
      },
    })
  )

  const isMessageCreationPending = createMessage.isPending

  const refetchProject = () => {
    queryClient.invalidateQueries(
      trpc.project.getOne.queryOptions({ id: projectId })
    )
  }

  const handleFragmentClicked = (fragment: Fragment | null) => {
    setActiveFragment(fragment)
  }

  const handleCreateMessage = async (msg: {
    content: string
    role: MessageRole
    timeTaken: number
    inputTokens: number
    outputTokens: number
    model?: string
    state: string
    fragment?: {
      type: FragmentType
      title: string
      files: Record<string, string>
    }
    events?: string[]
  }) => {
    try {
      await createMessage.mutateAsync({
        projectId,
        content: msg.content,
        role: msg.role,
        type: 'RESULT',
        fragment: msg.fragment,
        timeTaken: msg.timeTaken || 0,
        inputTokens: msg.inputTokens || 0,
        outputTokens: msg.outputTokens || 0,
        model: msg.model || 'gpt-4o',
        state: msg.state,
        events: msg.events || [],
      })
    } catch (error) {
      console.error('Message creation failed:', error)
    }
  }

  const previousDeveloperFiles = useMemo(() => {
    if (!messages || !activeFragment) return undefined

    const currentMessageIndex = messages.findIndex(
      (msg) => msg.fragment?.id === activeFragment.id
    )

    if (currentMessageIndex === -1) return undefined

    const currentMessage = messages[currentMessageIndex]
    if (currentMessage.role !== 'DEVELOPER') return undefined

    for (let i = currentMessageIndex - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role === 'DEVELOPER' && msg.fragment?.files) {
        return msg.fragment.files as { [path: string]: string }
      }
    }

    return undefined
  }, [messages, activeFragment])

  if (!project || !session?.user?.email) {
    return null
  }

  return (
    <div className="h-screen bg-white text-black dark:bg-black dark:text-gray-100 transition-colors">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={35} minSize={20} maxSize={40}>
          <Suspense fallback={<p>Loading...</p>}>
            <MessageContainer
              messages={messages || []}
              isMessageCreationPending={isMessageCreationPending}
              onCreateMessage={handleCreateMessage}
              activeFragment={activeFragment}
              onFragmentClicked={handleFragmentClicked}
              tddEnabled={project?.tddEnabled || false}
              headerTitle={project?.name}
              showUsage={showUsage}
              setShowUsage={setShowUsage}
              projectId={projectId}
              onProjectUpdated={refetchProject}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="w-[0] bg-gray-200 hover:bg-gray-300 dark:bg-gray-950 dark:hover:bg-gray-700 transition-colors" />
        <ResizablePanel
          defaultSize={65}
          minSize={60}
          maxSize={80}
          className="flex flex-col"
        >
          {showUsage ? (
            <Usage messages={messages} />
          ) : (
            <Suspense fallback={<p>Loading...</p>}>
              {activeFragment?.type === 'DOC' ? (
                <div className="h-full overflow-auto">
                  <DocView
                    files={activeFragment.files as { [path: string]: string }}
                  />
                </div>
              ) : (
                <div className="h-full m-0 overflow-auto">
                  {!!activeFragment && (
                    <FileExplorer
                      files={activeFragment.files as { [path: string]: string }}
                      prevFiles={previousDeveloperFiles}
                    />
                  )}
                </div>
              )}
            </Suspense>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
