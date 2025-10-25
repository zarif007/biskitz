'use client'

import type React from 'react'
import { useState, useMemo, useEffect } from 'react'
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from './ui/resizable'
import CodeView from './code-view/code-view'
import {
  Folder,
  FolderOpen,
  FileIcon,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'

interface FileCollection {
  [path: string]: string
}

interface Props {
  files: FileCollection
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

const getLanguageFromExtension = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown',
  }
  return map[ext || ''] || 'plaintext'
}

const buildFileTree = (files: FileCollection): TreeNode[] => {
  type Internal = {
    name: string
    path: string
    type: 'file' | 'directory'
    children?: Record<string, Internal>
  }

  const root: Record<string, Internal> = {}

  Object.keys(files).forEach((path) => {
    const parts = path.split('/').filter(Boolean)
    let current = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const currentPath = parts.slice(0, index + 1).join('/')

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: isLast ? 'file' : 'directory',
          children: isLast ? undefined : {},
        }
      }

      if (!isLast && current[part].children) {
        current = current[part].children
      }
    })
  })

  const convert = (nodes: Record<string, Internal>): TreeNode[] =>
    Object.values(nodes)
      .map((n) => ({
        name: n.name,
        path: n.path,
        type: n.type,
        children: n.children ? convert(n.children) : undefined,
      }))
      .sort((a, b) =>
        a.type === b.type
          ? a.name.localeCompare(b.name)
          : a.type === 'directory'
          ? -1
          : 1
      )

  return convert(root)
}

const TreeItem: React.FC<{
  node: TreeNode
  onSelect: (path: string) => void
  selectedFile: string | null
  level: number
}> = ({ node, onSelect, selectedFile, level }) => {
  const [expanded, setExpanded] = useState(level < 1)
  const isSelected = selectedFile === node.path

  const handleClick = () => {
    if (node.type === 'file') onSelect(node.path)
    else setExpanded(!expanded)
  }

  return (
    <div>
      <div
        className={`flex items-center h-7 px-2 cursor-pointer text-xs font-mono select-none
          ${
            isSelected
              ? 'bg-blue-600/20 dark:bg-blue-500/20 font-medium'
              : 'hover:bg-gray-200/40 dark:hover:bg-white/5'
          }
          ${isSelected ? 'text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          expanded ? (
            <ChevronDown size={14} className="mr-1 text-gray-500" />
          ) : (
            <ChevronRight size={14} className="mr-1 text-gray-500" />
          )
        ) : (
          <FileIcon size={14} className="mr-1 text-gray-400" />
        )}
        {node.type === 'directory' ? (
          expanded ? (
            <FolderOpen size={14} className="mr-1 text-blue-500" />
          ) : (
            <Folder size={14} className="mr-1 text-blue-500" />
          )
        ) : null}
        <span className="truncate font-medium text-sm">{node.name}</span>
      </div>
      {node.type === 'directory' && expanded && node.children && (
        <div className="transition-all">
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              onSelect={onSelect}
              selectedFile={selectedFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const FileExplorer = ({ files }: Props) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])

  const fileTree = useMemo(() => buildFileTree(files), [files])

  useEffect(() => {
    const firstFile = Object.keys(files)[0]
    if (firstFile) {
      setSelectedFile(firstFile)
      setOpenTabs([firstFile])
    }
  }, [files])

  const openFile = (path: string) => {
    setSelectedFile(path)
    if (!openTabs.includes(path)) setOpenTabs([...openTabs, path])
  }

  const closeTab = (path: string) => {
    const newTabs = openTabs.filter((t) => t !== path)
    setOpenTabs(newTabs)
    if (selectedFile === path)
      setSelectedFile(newTabs[newTabs.length - 1] || null)
  }

  const selectedContent = selectedFile ? files[selectedFile] : ''
  const selectedLanguage = selectedFile
    ? getLanguageFromExtension(selectedFile)
    : 'plaintext'
  const breadcrumb = selectedFile ? selectedFile.split('/').join(' ▸ ') : ''

  return (
    <div className="h-full bg-white dark:bg-black overflow-hidden border border-y-0 border-gray-200 dark:border-gray-700 font-sans">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
          <div className="h-full flex flex-col">
            <div className="h-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-2">
              <span className="h-10 p-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                Explorer
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="py-1 min-h-full">
                {fileTree.map((node) => (
                  <TreeItem
                    key={node.path}
                    node={node}
                    onSelect={openFile}
                    selectedFile={selectedFile}
                    level={0}
                  />
                ))}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-950 dark:hover:bg-gray-700 transition-colors" />

        <ResizablePanel defaultSize={78} minSize={65}>
          <div className="h-full flex flex-col">
            <div className="h-10 flex items-center bg-white dark:bg-black border-0 border-b border-gray-200 dark:border-gray-700">
              <div className="flex overflow-x-auto whitespace-nowrap">
                {openTabs.map((tab) => (
                  <div
                    key={tab}
                    className={`flex items-center px-4 py-2 cursor-pointer text-xs font-mono transition-colors duration-150 border-gray-200 dark:border-gray-700
                      ${
                        selectedFile === tab
                          ? 'bg-gray-100 dark:bg-gray-950 text-blue-400 rounded font-medium'
                          : 'text-gray-500 hover:bg-gray-200/60 dark:hover:bg-gray-800/60'
                      }`}
                    onClick={() => setSelectedFile(tab)}
                  >
                    <span className="truncate max-w-[150px]">
                      {tab.split('/').pop()}
                    </span>
                    <X
                      size={12}
                      className="ml-2 opacity-60 hover:opacity-100 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {selectedFile ? (
              <>
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="min-w-max">
                      <CodeView
                        code={selectedContent}
                        lang={selectedLanguage}
                      />
                    </div>
                  </ScrollArea>
                </div>
                <div className="h-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 flex items-center text-[10px] font-mono text-gray-600 dark:text-gray-400 truncate">
                  {breadcrumb || 'No file selected'}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center opacity-60">
                  <div className="text-5xl mb-3">📂</div>
                  <p className="text-sm">Select a file to view its contents</p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default FileExplorer
