'use client'

import type React from 'react'
import { useState, useMemo, useEffect, useRef } from 'react'
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
  Download,
  Terminal as TerminalIcon,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface FileCollection {
  [path: string]: string
}

interface Props {
  files: FileCollection
  prevFiles?: FileCollection
  isTerminalOpen?: boolean
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
  added?: number
  deleted?: number
}

interface TerminalTab {
  id: string
  name: string
  output: string
  cwd: string
}

let globalWebContainer: any = null
let isBootingWebContainer = false

const downloadAsZip = async (
  files: FileCollection,
  folderName: string = 'project'
) => {
  const zip = new JSZip()
  const root = zip.folder(folderName)!

  Object.entries(files).forEach(([path, content]) => {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    root.file(normalizedPath, content)
  })

  try {
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${folderName}.zip`)
  } catch (err) {
    console.error('Failed to generate ZIP:', err)
    alert('Failed to download files. Check console for details.')
  }
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
            ) : null}
            {node.deleted && node.deleted > 0 ? (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded text-[10px] font-semibold">
                -{node.deleted}
              </span>
            ) : null}
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

const convertToFileSystemTree = (files: FileCollection) => {
  const tree: any = {}
  Object.entries(files).forEach(([path, content]) => {
    const parts = path.split('/').filter(Boolean)
    let current = tree
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        current[part] = { file: { contents: content } }
      } else {
        if (!current[part]) current[part] = { directory: {} }
        if ('directory' in current[part]) {
          current = current[part].directory
        }
      }
    }
  })
  return tree
}

const stripAnsiCodes = (text: string): string => {
  return text
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07]*\x07/g, '')
    .replace(/\[[\d;]*[A-Za-z]/g, '')
    .replace(/\r/g, '')
}

const cleanTerminalOutput = (text: string): string => {
  let cleaned = stripAnsiCodes(text)
  const lines = cleaned.split('\n')
  const processedLines: string[] = []

  for (const line of lines) {
    if (line.trim() === '' || /^[|\\\/\-]$/.test(line.trim())) {
      continue
    }
    if (/^[|\\\/\-\s]+$/.test(line)) {
      continue
    }
    processedLines.push(line)
  }

  return processedLines.join('\n')
}

interface TerminalProps {
  files: FileCollection
  onClose: () => void
}

const Terminal: React.FC<TerminalProps> = ({ files, onClose }) => {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: '1', name: 'bash', output: '', cwd: '/home/project' },
  ])
  const [activeTab, setActiveTab] = useState('1')
  const [currentCommand, setCurrentCommand] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const [webContainer, setWebContainer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentProcess, setCurrentProcess] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const outputBufferRef = useRef<string>('')
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const activeTerminal = tabs.find((t) => t.id === activeTab)

  const flushBuffer = () => {
    if (outputBufferRef.current) {
      const cleanedOutput = cleanTerminalOutput(outputBufferRef.current)
      if (cleanedOutput.trim()) {
        setTabs((prev) =>
          prev.map((tab) => {
            if (tab.id !== activeTab) return tab
            return { ...tab, output: tab.output + cleanedOutput + '\n' }
          })
        )
      }
      outputBufferRef.current = ''
    }
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 0)
  }

  const addToBuffer = (text: string) => {
    outputBufferRef.current += text
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current)
    }
    flushTimeoutRef.current = setTimeout(flushBuffer, 100)
  }

  const addToTerminal = (text: string, immediate: boolean = false) => {
    if (immediate) {
      const cleanedOutput = cleanTerminalOutput(text)
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTab) return tab
          return { ...tab, output: tab.output + cleanedOutput }
        })
      )
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
      }, 0)
    } else {
      addToBuffer(text)
    }
  }

  const updateCwd = (newCwd: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTab) return tab
        return { ...tab, cwd: newCwd }
      })
    )
  }

  useEffect(() => {
    const loadWebContainer = async () => {
      try {
        addToTerminal('Initializing WebContainer...\n', true)

        const { WebContainer } = await import('@webcontainer/api')

        if (globalWebContainer) {
          setWebContainer(globalWebContainer)
          addToTerminal('Using existing WebContainer instance\n', true)
        } else if (isBootingWebContainer) {
          addToTerminal('WebContainer is already booting, waiting...\n', true)
          const checkInterval = setInterval(() => {
            if (globalWebContainer && !isBootingWebContainer) {
              clearInterval(checkInterval)
              setWebContainer(globalWebContainer)
              addToTerminal('WebContainer ready\n', true)
            }
          }, 100)
          return
        } else {
          isBootingWebContainer = true
          globalWebContainer = await WebContainer.boot()
          isBootingWebContainer = false
          setWebContainer(globalWebContainer)
          addToTerminal('WebContainer booted successfully\n', true)
        }

        const fileSystemTree = convertToFileSystemTree(files)
        await globalWebContainer.mount(fileSystemTree)
        addToTerminal('Files mounted successfully\n', true)
        addToTerminal('\nReady! Type commands below.\n\n', true)

        setIsLoading(false)
      } catch (error) {
        addToTerminal(`Error initializing WebContainer: ${error}\n`, true)
        isBootingWebContainer = false
        setIsLoading(false)
      }
    }
    loadWebContainer()
  }, [files])

  const killCurrentProcess = () => {
    if (currentProcess) {
      currentProcess.kill()
      addToTerminal('^C\n', true)
      setCurrentProcess(null)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (currentProcess) {
          e.preventDefault()
          killCurrentProcess()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentProcess])

  const resolvePath = (currentCwd: string, targetPath: string): string => {
    if (targetPath.startsWith('/')) {
      return targetPath
    }

    const parts = currentCwd.split('/').filter(Boolean)
    const targetParts = targetPath.split('/').filter(Boolean)

    for (const part of targetParts) {
      if (part === '..') {
        if (parts.length > 0) parts.pop()
      } else if (part !== '.') {
        parts.push(part)
      }
    }

    return '/' + parts.join('/')
  }

  const runCommand = async (command: string) => {
    if (!webContainer || !command.trim()) return

    const trimmedCommand = command.trim()
    const args = trimmedCommand.split(/\s+/)
    const cmd = args[0]
    const cmdArgs = args.slice(1)
    const cwd = activeTerminal?.cwd || '/home/project'

    const displayPath = cwd.replace('/home/project', '~')
    addToTerminal(`${displayPath} $ ${trimmedCommand}\n`, true)

    if (cmd === 'clear') {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTab ? { ...tab, output: '' } : tab))
      )
      return
    }

    if (cmd === 'cd') {
      const targetPath = cmdArgs[0] || '/home/project'
      let newCwd: string

      if (targetPath === '~') {
        newCwd = '/home/project'
      } else if (targetPath === '-') {
        newCwd = '/home/project'
      } else {
        newCwd = resolvePath(cwd, targetPath)
      }

      try {
        const process = await webContainer.spawn(
          'ls',
          [newCwd.replace('/home/project', '.') || '.'],
          {
            cwd: '.',
          }
        )
        const exitCode = await process.exit

        if (exitCode === 0) {
          updateCwd(newCwd)
        } else {
          addToTerminal(`cd: no such file or directory: ${targetPath}\n`, true)
        }
      } catch {
        updateCwd(newCwd)
      }
      return
    }

    if (cmd === 'pwd') {
      addToTerminal(`${cwd}\n`, true)
      return
    }

    try {
      const workingDir = cwd.replace('/home/project', '.') || '.'
      const process = await webContainer.spawn(cmd, cmdArgs, {
        terminal: { cols: 80, rows: 24 },
        cwd: workingDir,
      })

      setCurrentProcess(process)

      process.output.pipeTo(
        new WritableStream({
          write(data: any) {
            let text = ''
            if (data instanceof Uint8Array) {
              text = new TextDecoder().decode(data)
            } else if (typeof data === 'string') {
              text = data
            } else {
              text = String(data)
            }
            addToBuffer(text)
          },
          close() {
            flushBuffer()
            setCurrentProcess(null)
          },
          abort(err: any) {
            flushBuffer()
            addToTerminal(`Process aborted: ${err}\n`, true)
            setCurrentProcess(null)
          },
        })
      )

      const exitCode = await process.exit

      flushBuffer()

      if (exitCode !== 0 && exitCode !== undefined) {
        addToTerminal(`Process exited with code ${exitCode}\n`, true)
      }

      setCurrentProcess(null)
    } catch (error) {
      addToTerminal(`Error: ${error}\n`, true)
    }
  }

  const executeCommand = async () => {
    if (!currentCommand.trim()) return

    const command = currentCommand.trim()

    if (
      command &&
      (!commandHistory.length ||
        commandHistory[commandHistory.length - 1] !== command)
    ) {
      setCommandHistory((prev) => [...prev, command])
    }
    setHistoryIndex(-1)

    setCurrentCommand('')
    await runCommand(command)

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1)
        if (
          newIndex === commandHistory.length - 1 &&
          historyIndex === commandHistory.length - 1
        ) {
          setHistoryIndex(-1)
          setCurrentCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[newIndex])
        }
      }
    }
  }

  const clearTerminal = () => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeTab ? { ...tab, output: '' } : tab))
    )
  }

  const addTab = () => {
    const id = Date.now().toString()
    setTabs((prev) => [
      ...prev,
      { id, name: 'bash', output: '', cwd: '/home/project' },
    ])
    setActiveTab(id)
  }

  const closeTab = (id: string) => {
    if (tabs.length === 1) return
    const idx = tabs.findIndex((t) => t.id === id)
    const newTabs = tabs.filter((t) => t.id !== id)
    setTabs(newTabs)
    if (activeTab === id) {
      setActiveTab(newTabs[Math.max(0, idx - 1)].id)
    }
  }

  const formatTerminalOutput = (output: string) => {
    return output.split('\n').map((line, index) => (
      <div
        key={index}
        className="whitespace-pre-wrap leading-[1.4] min-h-[1.4em]"
      >
        {line || '\u00A0'}
      </div>
    ))
  }

  const displayCwd = (activeTerminal?.cwd || '/home/project').replace(
    '/home/project',
    '~'
  )

  return (
    <div
      className="h-full flex flex-col bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-mono text-[13px]"
      style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace" }}
    >
      <div className="flex items-center justify-between h-[35px] bg-gray-100 dark:bg-[#1e1e1e] border-b border-gray-300 dark:border-[#3c3c3c] px-2">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors
                ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-black text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-[#969696] hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#2a2d2e]'
                }`}
            >
              <TerminalIcon size={12} />
              <span>{tab.name}</span>
              {tabs.length > 1 && (
                <X
                  size={12}
                  className="opacity-60 hover:opacity-100 ml-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                />
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2d2e] text-gray-600 dark:text-[#969696] hover:text-gray-900 dark:hover:text-white transition-colors ml-1"
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={clearTerminal}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2d2e] text-gray-600 dark:text-[#969696] hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Clear Terminal"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2d2e] text-gray-600 dark:text-[#969696] hover:text-gray-900 dark:hover:text-white transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2d2e] text-gray-600 dark:text-[#969696] hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Close Terminal"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-3 bg-white dark:bg-black cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {formatTerminalOutput(activeTerminal?.output || '')}
        {!isLoading && (
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-500 mr-1">
              {displayCwd}
            </span>
            <span className="text-green-600 dark:text-green-500 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 caret-gray-900 dark:caret-gray-100"
              style={{
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: '13px',
              }}
              autoFocus
              disabled={isLoading || currentProcess !== null}
              placeholder={
                currentProcess ? 'Process running... (Ctrl/Cmd+C to stop)' : ''
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

const FileExplorer = ({ files, prevFiles, isTerminalOpen = false }: Props) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [isTerminalOpenState, setIsTerminalOpen] = useState(isTerminalOpen)

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

  const MainContent = (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
        <div className="h-full flex flex-col">
          <div className="h-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-2">
            <span className="h-10 p-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
              Explorer
            </span>
            <div className="flex items-center gap-1">
              {isTerminalOpenState && (
                <button
                  onClick={() => setIsTerminalOpen(true)}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors opacity-70 hover:opacity-100"
                  title="Open Terminal"
                >
                  <TerminalIcon
                    size={16}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </button>
              )}
              <button
                onClick={() => downloadAsZip(files, 'my-project')}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors opacity-70 hover:opacity-100"
                title="Download all files as ZIP"
              >
                <Download
                  size={16}
                  className="text-gray-600 dark:text-gray-400"
                />
              </button>
            </div>
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
            <div className="flex overflow-x-auto whitespace-nowrap ml-1">
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
                    <CodeView code={selectedContent} lang={selectedLanguage} />
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
  )

  return (
    <div className="h-full bg-white dark:bg-black overflow-hidden border border-y-0 border-gray-200 dark:border-gray-700 font-sans">
      {isTerminalOpenState ? (
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={80} minSize={30}>
            {MainContent}
          </ResizablePanel>
          <ResizableHandle className="h-[1px] bg-gray-300 dark:bg-[#3c3c3c] hover:bg-blue-500 dark:hover:bg-[#007acc] transition-colors" />
          <ResizablePanel defaultSize={20} minSize={20} maxSize={70}>
            <Terminal files={files} onClose={() => setIsTerminalOpen(false)} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        MainContent
      )}
    </div>
  )
}

export default FileExplorer
