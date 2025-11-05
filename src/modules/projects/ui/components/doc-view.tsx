import React, { useState, useEffect } from 'react'
import { FileText, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react'
import parseMarkdown from '@/utils/parseMarkdown'

interface Props {
  files: Record<string, string>
}

const DocView = ({ files }: Props) => {
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fileEntries = Object.entries(files)

  useEffect(() => {
    if (fileEntries.length > 0) {
      setSelectedFile(fileEntries[0][0])
    }
  }, [files])

  const currentContent = selectedFile ? files[selectedFile] : ''

  return (
    <div
      className={`min-h-screen transition-colors duration-200 dark:bg-gray-950 bg-gray-100`}
    >
      <div className="flex">
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden`}
        >
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Documents ({fileEntries.length})
            </h2>
            <nav className="space-y-1">
              {fileEntries.map(([filename]) => (
                <button
                  key={filename}
                  onClick={() => setSelectedFile(filename)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFile === filename
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText size={16} />
                    <span className="truncate">{filename}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-h-screen relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft
                size={16}
                className="text-gray-600 dark:text-gray-400"
              />
            ) : (
              <ChevronRight
                size={16}
                className="text-gray-600 dark:text-gray-400"
              />
            )}
          </button>

          {selectedFile ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-black min-h-screen">
                <div className="px-8 py-8 pt-16">
                  <div
                    className="prose prose-lg max-w-none leading-relaxed text-gray-700 dark:text-gray-300"
                    style={{
                      lineHeight: '1.6',
                      fontSize: '16px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(currentContent),
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FileText
                  size={48}
                  className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No document selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {fileEntries.length === 0
                    ? 'No files available'
                    : 'Select a document from the sidebar to view'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DocView
