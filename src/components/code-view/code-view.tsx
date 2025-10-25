import Prism from 'prismjs'
import React, { useEffect } from 'react'
import { Copy, Download } from 'lucide-react'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-markdown'

import './code-theme.css'

interface Props {
  code: string
  lang: string
  fileName?: string
}

const CodeView = ({ code, lang, fileName = 'code' }: Props) => {
  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  const lines = code.split('\n')

  return (
    <div className="relative overflow-hidden border-neutral-700 text-xs font-mono bg-transparent">
      {/* Code Area */}
      <div className="relative flex font-mono text-xs leading-[1.6]">
        {/* Line numbers */}
        <pre
          className="text-right select-none px-3 py-2 text-neutral-600 m-0"
          style={{
            lineHeight: '1.6em',
            whiteSpace: 'pre',
          }}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </pre>

        {/* Code block */}
        <pre
          className="p-2 m-0 overflow-x-auto w-full"
          style={{
            lineHeight: '1.6em',
            whiteSpace: 'pre',
          }}
        >
          <code className={`language-${lang}`}>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export default CodeView
