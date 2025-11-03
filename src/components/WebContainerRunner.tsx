/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useRef } from 'react'
import { Square, Maximize2, Minimize2 } from 'lucide-react'
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import FileExplorer from './FileExplorer'

interface Props {
  files: { [path: string]: string }
}

// Global WebContainer instance - only one allowed per page
let globalWebContainer: any = null
let isBootingWebContainer = false

const WebContainerRunner = ({ files }: Props) => {
  const [webContainer, setWebContainer] = useState<any>(null)
  const [terminalOutput, setTerminalOutput] = useState<string>('')
  const [currentCommand, setCurrentCommand] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false)
  const [activeTerminalTab, setActiveTerminalTab] = useState('terminal')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentProcess, setCurrentProcess] = useState<any>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const convertToFileSystemTree = (files: { [path: string]: string }) => {
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

  const addToTerminal = (text: string) => {
    setTerminalOutput((prev) => prev + text)
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 0)
  }

  useEffect(() => {
    const loadWebContainer = async () => {
      try {
        addToTerminal('🚀 Initializing WebContainer...\r\n')

        // Import WebContainer dynamically
        const { WebContainer } = await import('@webcontainer/api')

        // Check if we already have a WebContainer instance
        if (globalWebContainer) {
          setWebContainer(globalWebContainer)
          addToTerminal('✅ Using existing WebContainer instance\r\n')
        } else if (isBootingWebContainer) {
          addToTerminal('⏳ WebContainer is already booting, waiting...\r\n')
          // Wait for the other instance to finish booting
          const checkInterval = setInterval(() => {
            if (globalWebContainer && !isBootingWebContainer) {
              clearInterval(checkInterval)
              setWebContainer(globalWebContainer)
              addToTerminal('✅ WebContainer ready\r\n')
            }
          }, 100)
          return
        } else {
          // Boot a new instance
          isBootingWebContainer = true
          globalWebContainer = await WebContainer.boot()
          isBootingWebContainer = false
          setWebContainer(globalWebContainer)
          addToTerminal('✅ WebContainer booted successfully\r\n')
        }

        const fileSystemTree = convertToFileSystemTree(files)
        await globalWebContainer.mount(fileSystemTree)
        addToTerminal('📁 Files mounted successfully\r\n')
        addToTerminal('Ready! You can now run commands.\r\n\r\n')

        setIsLoading(false)
      } catch (error) {
        addToTerminal(`❌ Error initializing WebContainer: ${error}\r\n`)
        isBootingWebContainer = false
        setIsLoading(false)
      }
    }
    loadWebContainer()
  }, [files])

  const runCommand = async (command: string) => {
    if (!webContainer || !command.trim()) return

    const trimmedCommand = command.trim()

    // Handle built-in commands
    if (trimmedCommand === 'clear') {
      setTerminalOutput('')
      return
    }

    try {
      // Parse command and arguments properly
      const args = trimmedCommand.split(/\s+/)
      const cmd = args[0]
      const cmdArgs = args.slice(1)

      addToTerminal(`$ ${trimmedCommand}\r\n`)

      const process = await webContainer.spawn(cmd, cmdArgs, {
        terminal: {
          cols: 80,
          rows: 24,
        },
      })

      setCurrentProcess(process)

      // Use the proper WebContainer API with pipeTo and WritableStream
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            // Convert Uint8Array to string properly
            let text = ''
            if (data instanceof Uint8Array) {
              text = new TextDecoder().decode(data)
            } else if (typeof data === 'string') {
              text = data
            } else {
              text = String(data)
            }
            addToTerminal(text)
          },
          close() {
            setCurrentProcess(null)
          },
          abort(err) {
            addToTerminal(`\r\nProcess aborted: ${err}\r\n`)
            setCurrentProcess(null)
          },
        })
      )

      // Wait for process to complete
      const exitCode = await process.exit

      if (exitCode !== 0) {
        addToTerminal(`\r\nProcess exited with code ${exitCode}\r\n`)
      }

      setCurrentProcess(null)
    } catch (error) {
      addToTerminal(`Error executing command: ${error}\r\n`)
    }
  }

  const executeCommand = async () => {
    if (!currentCommand.trim()) return

    const command = currentCommand.trim()

    // Add to history
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

    // Focus input after command execution
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Basic tab completion could be added here
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      // Kill current process
      if (currentProcess) {
        currentProcess.kill()
        addToTerminal('^C\r\n')
        setCurrentProcess(null)
      }
    }
  }

  const clearTerminal = () => {
    setTerminalOutput('')
  }

  // Convert terminal output to HTML with proper line breaks
  const formatTerminalOutput = (output: string) => {
    return output
      .split('\r\n')
      .join('\n')
      .split('\n')
      .map((line, index) => (
        <div
          key={index}
          className="whitespace-pre-wrap leading-5 min-h-[1.25rem]"
        >
          {line || '\u00A0'}
        </div>
      ))
  }

  return (
    <div className="h-screen flex flex-col bg-white text-black dark:bg-gray-900 dark:text-white">
      <ResizablePanelGroup
        direction="vertical"
        className="flex flex-col flex-1"
      >
        {!isTerminalMaximized && (
          <ResizablePanel defaultSize={70}>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-full">
              <FileExplorer files={files} />
            </div>
          </ResizablePanel>
        )}
        {!isTerminalMaximized && <ResizableHandle />}
        <ResizablePanel
          defaultSize={isTerminalMaximized ? 100 : 30}
          minSize={20}
        >
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-800 flex flex-col h-full">
            <div className="h-10 bg-gray-200 dark:bg-gray-950 flex items-center justify-between px-4 border-b border-gray-300 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTerminalTab('terminal')}
                  className={`px-3 py-1 text-sm rounded ${
                    activeTerminalTab === 'terminal'
                      ? 'bg-gray-300 dark:bg-gray-800 text-black dark:text-white'
                      : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Terminal
                </button>
                <button
                  onClick={() => setActiveTerminalTab('problems')}
                  className={`px-3 py-1 text-sm rounded ${
                    activeTerminalTab === 'problems'
                      ? 'bg-gray-300 dark:bg-gray-800 text-black dark:text-white'
                      : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Problems
                </button>
                <button
                  onClick={() => setActiveTerminalTab('output')}
                  className={`px-3 py-1 text-sm rounded ${
                    activeTerminalTab === 'output'
                      ? 'bg-gray-300 dark:bg-gray-800 text-black dark:text-white'
                      : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Output
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearTerminal}
                  className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white p-1 rounded"
                  title="Clear Terminal"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsTerminalMaximized(!isTerminalMaximized)}
                  className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white p-1 rounded"
                  title={
                    isTerminalMaximized
                      ? 'Restore Terminal'
                      : 'Maximize Terminal'
                  }
                >
                  {isTerminalMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {activeTerminalTab === 'terminal' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div
                  ref={terminalRef}
                  className="flex-1 min-h-0 overflow-y-auto font-mono text-sm p-4 bg-black text-green-400"
                  style={{
                    fontFamily:
                      '"Courier New", "Monaco", "Lucida Console", monospace',
                    fontSize: '14px',
                    lineHeight: '1.25',
                  }}
                >
                  {formatTerminalOutput(terminalOutput)}
                  {!isLoading && (
                    <div className="flex items-center mt-2">
                      <span className="text-green-400 mr-2">
                        webcontainer:~$
                      </span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="bg-transparent border-none outline-none flex-1 text-green-400 caret-green-400"
                        autoFocus
                        disabled={isLoading || currentProcess !== null}
                        placeholder={currentProcess ? 'Process running...' : ''}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTerminalTab === 'problems' && (
              <div className="flex-1 p-4 text-gray-600 dark:text-gray-400">
                <div className="text-center py-8">No problems detected</div>
              </div>
            )}

            {activeTerminalTab === 'output' && (
              <div className="flex-1 p-4 text-gray-600 dark:text-gray-400">
                <div className="text-center py-8">No output to display</div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default WebContainerRunner
