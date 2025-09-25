import React, { useEffect, useState, useRef } from 'react'
import { Square, Maximize2, Minimize2 } from 'lucide-react'
import { FileSystemTree, WebContainer } from '@webcontainer/api'
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import FileExplorer from './FileExplorer'
import AnsiToHtml from 'ansi-to-html'

interface Props {
  files: { [path: string]: string }
}

const ansiConverter = new AnsiToHtml()
let globalWebContainer: any = null

const WebContainerRunner = ({ files }: Props) => {
  const [webContainer, setWebContainer] = useState<any>(null)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [currentCommand, setCurrentCommand] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false)
  const [activeTerminalTab, setActiveTerminalTab] = useState('terminal')
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const convertToFileSystemTree = (files: {
    [path: string]: string
  }): FileSystemTree => {
    const tree: FileSystemTree = {}
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
            current = (current[part] as { directory: FileSystemTree }).directory
          }
        }
      }
    })
    return tree
  }

  useEffect(() => {
    const loadWebContainer = async () => {
      try {
        setTerminalOutput(['🚀 Booting WebContainer...'])

        if (!globalWebContainer) {
          globalWebContainer = await WebContainer.boot()
        }

        setWebContainer(globalWebContainer)
        setTerminalOutput((prev) => [
          ...prev,
          '✅ WebContainer booted successfully',
        ])

        const fileSystemTree = convertToFileSystemTree(files)
        await globalWebContainer.mount(fileSystemTree)
        setTerminalOutput((prev) => [
          ...prev,
          '📁 Files mounted successfully',
          '',
        ])
        setIsLoading(false)
      } catch (error) {
        setTerminalOutput((prev) => [...prev, `❌ Error: ${error}`])
        setIsLoading(false)
      }
    }
    loadWebContainer()
  }, [files])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalOutput])

  const runCommand = async (cmd: string, args: string[] = []) => {
    if (!webContainer) return

    try {
      const process = await webContainer.spawn(cmd, args)

      const reader = process.output.getReader()
      const decoder = new TextDecoder()

      let outputBuffer = ''

      const readOutput = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            let text = ''
            if (value instanceof Uint8Array) {
              text = decoder.decode(value, { stream: true })
            } else if (typeof value === 'string') {
              text = value
            } else {
              text = String(value)
            }

            outputBuffer += text

            if (text.includes('\n') || text.includes('\r')) {
              const lines = outputBuffer.split(/\r?\n/)
              outputBuffer = lines.pop() || ''

              setTerminalOutput((prev) => {
                const newOutput = [...prev]
                if (lines.length > 0) {
                  if (newOutput.length > 0) {
                    newOutput[newOutput.length - 1] += lines[0]
                    newOutput.push(...lines.slice(1))
                  } else {
                    newOutput.push(...lines)
                  }
                }
                return newOutput
              })
            } else {
              setTerminalOutput((prev) => {
                const newOutput = [...prev]
                if (newOutput.length > 0) {
                  newOutput[newOutput.length - 1] += text
                } else {
                  newOutput.push(text)
                }
                return newOutput
              })
            }
          }

          if (outputBuffer) {
            setTerminalOutput((prev) => {
              const newOutput = [...prev]
              if (newOutput.length > 0) {
                newOutput[newOutput.length - 1] += outputBuffer
              } else {
                newOutput.push(outputBuffer)
              }
              return newOutput
            })
          }
        } catch (error) {
          console.error('Error reading output:', error)
        }
      }

      readOutput()

      const exitCode = await process.exit
      if (exitCode !== 0) {
        setTerminalOutput((prev) => [
          ...prev,
          `❌ Command exited with code ${exitCode}`,
        ])
      }
    } catch (error) {
      setTerminalOutput((prev) => [...prev, `❌ Command failed: ${error}`])
    }
  }

  const executeCommand = async () => {
    if (!currentCommand.trim()) return

    const trimmedCommand = currentCommand.trim()
    const [cmd, ...args] = trimmedCommand.split(' ')

    setTerminalOutput((prev) => [...prev, `$ ${trimmedCommand}`, ''])
    setCurrentCommand('')

    await runCommand(cmd, args)

    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
    }
  }

  const clearTerminal = () => {
    setTerminalOutput([])
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
            <div className="h-10 bg-gray-200 dark:bg-gray-950 flex items-center justify-between px-4 border-b border-gray-300 dark:border-gray-800">
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
                  className="flex-1 min-h-0 overflow-y-auto font-mono text-sm p-4 bg-gray-100 text-black dark:bg-gray-950 dark:text-gray-100"
                >
                  {terminalOutput.map((line, index) => (
                    <div
                      key={index}
                      className="whitespace-pre-wrap leading-5"
                      dangerouslySetInnerHTML={{
                        __html: ansiConverter.toHtml(line || ''),
                      }}
                    />
                  ))}
                  {!isLoading && (
                    <div className="flex items-center mt-2">
                      <span className="text-green-600 dark:text-green-400 mr-2">
                        $
                      </span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="bg-transparent border-none outline-none flex-1 text-black dark:text-gray-100"
                        autoFocus
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
