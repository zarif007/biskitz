"use client";

import { useTRPC } from "@/trpc/client";
import React, { Suspense, useState } from "react";
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
import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import FragmentWeb from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2Icon, CrownIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import FileExplorer from "@/components/FileExplorer";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({ projectId })
  );

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );

        const previousMessages = queryClient.getQueryData(
          trpc.messages.getMany.queryOptions({ projectId }).queryKey
        );

        const optimisticUserMessage = {
          id: `temp-${Date.now()}`,
          role: MessageRole.USER,
          content: variables.value,
          createdAt: new Date(),
          fragment: null,
          type: MessageType.RESULT,
          projectId: variables.projectId,
        };

        queryClient.setQueryData(
          trpc.messages.getMany.queryOptions({ projectId }).queryKey,
          (old: any) => [...(old || []), optimisticUserMessage]
        );

        return { previousMessages };
      },
      onError: (error, variables, context) => {
        queryClient.setQueryData(
          trpc.messages.getMany.queryOptions({ projectId }).queryKey,
          context?.previousMessages
        );
        console.error("Error creating message:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );
      },
    })
  );

  const isMessageCreationPending = createMessage.isPending;

  const handleFragmentClicked = (fragment: Fragment | null) => {
    setActiveFragment(fragment);
  };

  const handleCreateMessage = async (content: string) => {
    try {
      await createMessage.mutateAsync({ value: content, projectId });
    } catch (error) {
      console.error("Message creation failed:", error);
    }
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
              activeFragment={activeFragment}
              onFragmentClicked={handleFragmentClicked}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-950 dark:hover:bg-gray-700 transition-colors" />
        <ResizablePanel defaultSize={65} minSize={60} maxSize={80}>
          <Suspense fallback={<p>Loading...</p>}>
            <Tabs
              className="h-full gap-y-0"
              defaultValue="preview"
              value={tabState}
              onValueChange={(value) =>
                setTabState(value as "preview" | "code")
              }
            >
              <div className="w-full flex items-center p-2 border-b gap-x-2">
                <TabsList className="h-8 p-0 border rounded-md">
                  <TabsTrigger value="preview" className="rounded-sm">
                    <EyeIcon /> <span>Demo</span>
                  </TabsTrigger>
                  <TabsTrigger value="code" className="rounded-sm">
                    <Code2Icon /> <span>Code</span>
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-x-2">
                  <Button asChild size="sm" variant="default">
                    <Link href="/pricing">
                      <CrownIcon />
                      Upgrade
                    </Link>
                  </Button>
                </div>
              </div>
              <TabsContent value="preview">
                {!!activeFragment && (
                  <FragmentWeb activeFragment={activeFragment} />
                )}
              </TabsContent>
              <TabsContent value="code">
                {!!activeFragment && (
                  <FileExplorer
                    files={activeFragment.files as { [path: string]: string }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </Suspense>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
