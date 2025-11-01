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
  File,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'

interface FileCollection {
  [path: string]: string
}

interface Props {
  files: FileCollection
  prevFiles?: FileCollection
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
  added?: number
  deleted?: number
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

const calculateLineDiff = (
  currentContent?: string,
  prevContent?: string
): { added: number; deleted: number } => {
  if (!prevContent && currentContent) {
    return { added: currentContent.split('\n').length, deleted: 0 }
  }
  if (prevContent && !currentContent) {
    return { added: 0, deleted: prevContent.split('\n').length }
  }
  if (!prevContent && !currentContent) return { added: 0, deleted: 0 }

  const currentLines = currentContent!.split('\n')
  const prevLines = prevContent!.split('\n')

  let added = 0
  let deleted = 0

  const maxLen = Math.max(currentLines.length, prevLines.length)
  for (let i = 0; i < maxLen; i++) {
    const cur = currentLines[i]
    const prev = prevLines[i]
    if (cur !== prev) {
      if (cur === undefined) deleted++
      else if (prev === undefined) added++
      else {
        added++
        deleted++
      }
    }
  }

  return { added, deleted }
}

const buildFileTree = (
  files: FileCollection,
  prevFiles?: FileCollection
): TreeNode[] => {
  type Internal = {
    name: string
    path: string
    type: 'file' | 'directory'
    children?: Record<string, Internal>
    added?: number
    deleted?: number
  }

  const root: Record<string, Internal> = {}

  // merge both sets of paths to detect deleted files too
  const allPaths = new Set([
    ...Object.keys(files || {}),
    ...Object.keys(prevFiles || {}),
  ])

  allPaths.forEach((path) => {
    const parts = path.split('/').filter(Boolean)
    let current = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const currentPath = parts.slice(0, index + 1).join('/')

      if (!current[part]) {
        const diff = isLast
          ? calculateLineDiff(files?.[path], prevFiles?.[path])
          : undefined

        current[part] = {
          name: part,
          path: currentPath,
          type: isLast ? 'file' : 'directory',
          children: isLast ? undefined : {},
          added: diff?.added,
          deleted: diff?.deleted,
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
        added: n.added,
        deleted: n.deleted,
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
        className={`flex items-center justify-between h-7 px-2 cursor-pointer text-xs font-mono select-none
          ${
            isSelected
              ? 'bg-blue-600/20 dark:bg-blue-500/20 font-medium'
              : 'hover:bg-gray-200/40 dark:hover:bg-white/5'
          }
          ${isSelected ? 'text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center min-w-0 flex-1">
          {node.type === 'directory' ? (
            expanded ? (
              <ChevronDown
                size={14}
                className="mr-1 text-gray-500 flex-shrink-0"
              />
            ) : (
              <ChevronRight
                size={14}
                className="mr-1 text-gray-500 flex-shrink-0"
              />
            )
          ) : (
            <File size={14} className="mr-1 text-gray-400 flex-shrink-0" />
          )}
          {node.type === 'directory' ? (
            expanded ? (
              <FolderOpen
                size={14}
                className="mr-1 text-blue-500 flex-shrink-0"
              />
            ) : (
              <Folder size={14} className="mr-1 text-blue-500 flex-shrink-0" />
            )
          ) : null}
          <span className="truncate font-medium text-sm">{node.name}</span>
        </div>

        {node.type === 'file' && (
          <div className="ml-2 flex items-center gap-1 flex-shrink-0">
            {node.added && node.added > 0 ? (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-[10px] font-semibold">
                +{node.added}
              </span>
            ) : (
              <></>
            )}
            {node.deleted && node.deleted > 0 ? (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded text-[10px] font-semibold">
                -{node.deleted}
              </span>
            ) : (
              <></>
            )}
          </div>
        )}
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

const FileExplorer = ({ files, prevFiles }: Props) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])

  const fileTree = useMemo(
    () => buildFileTree(files, prevFiles),
    [files, prevFiles]
  )

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

  const getFileDiff = (path: string) =>
    calculateLineDiff(files?.[path], prevFiles?.[path])

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

        <ResizableHandle className="w-[1] bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors" />

        <ResizablePanel defaultSize={78} minSize={65}>
          <div className="h-full flex flex-col">
            <div className="h-10 flex items-center bg-white dark:bg-black border-0 border-b border-gray-200 dark:border-gray-700">
              <div className="flex overflow-x-auto whitespace-nowrap">
                {openTabs.map((tab) => {
                  return (
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
                  )
                })}
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
