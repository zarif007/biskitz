import { MessageRole } from '@/generated/prisma'
import React from 'react'

const AssistantAvatar = ({ type }: { type: MessageRole }) => {
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

  const gradientClass =
    roleColorMap[type] ||
    'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500'

  return <div className={`w-8 h-8 rounded-full ${gradientClass} shadow-lg`} />
}

export default AssistantAvatar
