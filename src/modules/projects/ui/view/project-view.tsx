'use client'

import { useTRPC } from '@/trpc/client'
import React, { Suspense, useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import MessageContainer from '../components/message-container'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { Fragment, FragmentType, MessageRole } from '@/generated/prisma'
import FileExplorer from '@/components/FileExplorer'
import DocView from '../components/doc-view'

interface Props {
  projectId: string
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({ projectId })
  )

  const { data: project } = useSuspenseQuery(
    trpc.project.getOne.queryOptions({ id: projectId })
  )

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
    fragment?: {
      type: FragmentType
      title: string
      files: Record<string, string>
    }
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
      })
    } catch (error) {
      console.error('Message creation failed:', error)
    }
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
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-950 dark:hover:bg-gray-700 transition-colors" />
        <ResizablePanel
          defaultSize={65}
          minSize={60}
          maxSize={80}
          className="flex flex-col"
        >
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
                  // <WebContainerRunner
                  //   files={activeFragment.files as { [path: string]: string }}
                  // />
                  <FileExplorer
                    files={activeFragment.files as { [path: string]: string }}
                  />
                )}
              </div>
            )}
          </Suspense>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
