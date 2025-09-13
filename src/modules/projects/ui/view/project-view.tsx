"use client";

import { useTRPC } from "@/trpc/client";
import React, { Suspense } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import MessageContainer from "../components/message-container";
import ProjectContainer from "../components/project-container";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Fragment } from "@/generated/prisma";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({ projectId })
  );

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );
      },
      onError: (error) => {
        console.error("Error creating message:", error);
      },
    })
  );

  const isMessageCreationPending = createMessage.isPending;

  const handleFragmentClicked = (fragment: Fragment) => {
    console.log("Fragment clicked:", fragment);
  };

  const handleCreateMessage = async (content: string) => {
    await createMessage.mutateAsync({ value: content, projectId });
  };

  return (
    <div className="h-screen bg-white text-black dark:bg-black dark:text-gray-100 transition-colors">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={35} minSize={20} maxSize={40}>
          <Suspense fallback={<p>Loading...</p>}>
            <MessageContainer
              messages={messages || []}
              isMessageCreationPending={isMessageCreationPending}
              onCreateMessage={handleCreateMessage}
              onFragmentClicked={handleFragmentClicked}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-950 dark:hover:bg-gray-700 transition-colors" />
        <ResizablePanel defaultSize={65} minSize={60} maxSize={80}>
          <Suspense fallback={<p>Loading...</p>}>
            <ProjectContainer projectId={projectId} />
          </Suspense>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
