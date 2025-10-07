import Prism from 'prismjs'
import React, { useEffect } from 'react'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-markdown'

import './code-theme.css'
import parseMarkdown from '@/utils/parseMarkdown'

interface Props {
  code: string
  lang: string
}

const CodeView = ({ code, lang }: Props) => {
  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  return (
    <div className="p-2 bg-transparent border-none rounded-none m-0 text-xs">
      {lang === 'plaintext' ? (
        <div
          dangerouslySetInnerHTML={{
            __html: parseMarkdown(code),
          }}
        />
      ) : (
        <pre>
          <code className={`language-${lang}`}>{code}</code>
        </pre>
      )}
    </div>
  )
}

export default CodeView
