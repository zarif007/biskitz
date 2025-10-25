import { Fragment, MessageRole, MessageType } from '@/generated/prisma'
import React, { useMemo } from 'react'

interface Message {
  role: MessageRole
  content: string
  createdAt: Date
  fragment: Fragment | null
  type: MessageType
  id?: string
  inputTokens: number
  outputTokens: number
  model: string
  timeTaken?: number
}

interface Props {
  messages: Message[]
}

const Usage = ({ messages }: Props) => {
  const {
    totalMessages,
    totalTimeSeconds,
    totalInputTokens,
    totalOutputTokens,
  } = useMemo(() => {
    const totalMessages = messages.length
    const totalTimeSeconds = messages.reduce(
      (acc, m) => acc + (m.timeTaken || 0),
      0
    )
    const totalInputTokens = messages.reduce(
      (acc, m) => acc + (m.inputTokens || 0),
      0
    )
    const totalOutputTokens = messages.reduce(
      (acc, m) => acc + (m.outputTokens || 0),
      0
    )
    return {
      totalMessages,
      totalTimeSeconds,
      totalInputTokens,
      totalOutputTokens,
    }
  }, [messages])
  return (
    <div>
      <span className="mr-2">{totalInputTokens} in</span>
      <span>{totalOutputTokens} out</span>
    </div>
  )
}

export default Usage
