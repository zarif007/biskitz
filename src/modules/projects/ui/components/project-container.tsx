import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

interface Props {
  projectId: string;
}

const ProjectContainer = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.project.getOne.queryOptions({ id: projectId })
  );

  return (
    <div className="h-full bg-white dark:bg-black">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-900">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h2 className="text-lg font-semibold">Project Details</h2>
          <Badge
            variant="outline"
            className="border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400"
          >
            JSON
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-5rem)]">
        <div className="p-4">
          <Card className="bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-900">
            <div className="p-4">
              <pre className="text-sm text-gray-900 dark:text-gray-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(project, null, 2)}
              </pre>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectContainer;
