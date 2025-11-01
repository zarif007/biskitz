import { MessageRole } from '@/generated/prisma'
import React, { useEffect, useState } from 'react'

const MessageLoader = ({ type }: { type: MessageRole }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const roleColorMap: Record<MessageRole, string> = {
    USER: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
    ASSISTANT: 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500',
    SYSTEM: 'bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700',
    BUSINESS_ANALYST:
      'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
    PROJECT_MANAGER:
      'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600',
    SYSTEM_ARCHITECT:
      'bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-700',
    DEVELOPER: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
    TESTER: 'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600',
    SECURITY_ANALYST:
      'bg-gradient-to-br from-amber-400 via-orange-500 to-red-600',
    DEV_OPS: 'bg-gradient-to-br from-teal-400 via-green-500 to-emerald-600',
  }

  const roleMessages: Record<MessageRole, string[]> = {
    USER: ['User is processing input'],
    ASSISTANT: ['Assistant is generating response'],
    SYSTEM: ['System is managing system'],
    BUSINESS_ANALYST: ['Business Analyst is analyzing requirements'],
    PROJECT_MANAGER: ['Project Manager is planning the project'],
    SYSTEM_ARCHITECT: ['System Architect is designing architecture'],
    DEVELOPER: ['Developer is writing code'],
    TESTER: ['Tester is writing testing functionality'],
    SECURITY_ANALYST: ['Security Analyst is securing system'],
    DEV_OPS: ['DevOps is deploying systems'],
  }

  const messages = roleMessages[type] || ['Processing...']
  const gradientClass =
    roleColorMap[type] ||
    'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500'

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        className={`w-18 h-18 rounded-full ${gradientClass} shadow-lg animate-spin`}
        style={{
          animation: 'spin 2s linear infinite, 1.5s ease-in-out infinite',
        }}
      />

      <div className="text-gray-600 dark:text-gray-400 text-sm animate-pulse mt-4">
        {messages[currentMessageIndex]}
      </div>
    </div>
  )
}

export default MessageLoader
