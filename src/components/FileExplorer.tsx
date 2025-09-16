import React, { useState } from "react";
import { ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import CodeView from "./code-view/code-view";
import { Folder, FolderOpen, File as FileIcon } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface FileCollection {
  [path: string]: string;
}

interface Props {
  files: FileCollection;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

const getLanguageFromExtension = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
  };
  return languageMap[extension || ""] || "plaintext";
};

const buildFileTree = (files: FileCollection): TreeNode[] => {
  type InternalTreeNode = {
    name: string;
    path: string;
    type: "file" | "directory";
    children?: { [key: string]: InternalTreeNode };
  };

  const root: { [key: string]: InternalTreeNode } = {};

  Object.keys(files).forEach((path) => {
    const parts = path.split("/").filter((part) => part.length > 0);
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: isLast ? "file" : "directory",
          children: isLast ? undefined : {},
        };
      }

      if (!isLast && current[part].children) {
        current = current[part].children as { [key: string]: InternalTreeNode };
      }
    });
  });

  const convertToArray = (nodes: {
    [key: string]: InternalTreeNode;
  }): TreeNode[] => {
    return Object.values(nodes)
      .map((node) => ({
        name: node.name,
        path: node.path,
        type: node.type,
        children: node.children ? convertToArray(node.children) : undefined,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  };

  return convertToArray(root);
};

const TreeItem: React.FC<{
  node: TreeNode;
  selectedFile: string | null;
  onSelect: (path: string) => void;
  level: number;
}> = ({ node, selectedFile, onSelect, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.type === "file") {
      onSelect(node.path);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center h-7 px-2 cursor-pointer text-[14px] select-none
          transition-colors duration-100 ease-in-out
          ${
            isSelected
              ? "bg-gray-950/30 dark:bg-gray-700/40 font-semibold"
              : "hover:bg-gray-200/50 dark:hover:bg-gray-950/50"
          }
          ${
            isSelected
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-700 dark:text-gray-300"
          }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "directory" ? (
          isExpanded ? (
            <FolderOpen
              size={16}
              className="mr-1.5 text-gray-600 dark:text-gray-300"
            />
          ) : (
            <Folder
              size={16}
              className="mr-1.5 text-gray-600 dark:text-gray-300"
            />
          )
        ) : (
          <FileIcon
            size={16}
            className="mr-1.5 text-gray-500 dark:text-gray-400"
          />
        )}
        <span className="truncate font-mono">{node.name}</span>
      </div>

      {node.type === "directory" && (
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out`}
          style={{ maxHeight: isExpanded ? "1000px" : "0px" }}
        >
          {node.children &&
            node.children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ files }: Props) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const fileTree = buildFileTree(files);
  const selectedContent = selectedFile ? files[selectedFile] || "" : "";
  const selectedLanguage = selectedFile
    ? getLanguageFromExtension(selectedFile)
    : "plaintext";

  return (
    <div
      className="h-full bg-gray-100 dark:bg-gray-950 overflow-hidden 
      border border-gray-300 dark:border-gray-950 shadow font-sans"
    >
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={35}
          className="bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-950"
        >
          <div className="h-full flex flex-col">
            <div
              className="h-8 bg-gray-100 dark:bg-gray-950 
              border-b border-gray-200 dark:border-gray-950 px-2.5 flex items-center py-4.5"
            >
              <span
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 
                uppercase tracking-wide"
              >
                Explorer
              </span>
            </div>
            <div
              className="flex-1 overflow-auto scrollbar-thin 
              scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 
              scrollbar-track-gray-100 dark:scrollbar-track-gray-900"
            >
              <div className="py-1.5">
                {fileTree.map((node) => (
                  <TreeItem
                    key={node.path}
                    node={node}
                    selectedFile={selectedFile}
                    onSelect={setSelectedFile}
                    level={0}
                  />
                ))}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizablePanel defaultSize={80} minSize={65}>
          <div className="h-full bg-gray-100 dark:bg-gray-950 flex flex-col">
            {selectedFile ? (
              <>
                <div
                  className="h-9 bg-gray-50 dark:bg-gray-950 
                  border-b border-gray-200 dark:border-gray-950 px-3 flex items-center gap-2 py-4.5"
                >
                  <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
                    {selectedFile.split("/").pop() || selectedFile}
                  </span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {selectedLanguage}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
                  <ScrollArea className="h-full w-full">
                    <div className="min-w-max">
                      <CodeView
                        code={selectedContent}
                        lang={selectedLanguage}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-950">
                <div className="text-center opacity-60">
                  <div className="text-5xl mb-2">📂</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Select a file to view its contents
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default FileExplorer;
