import { MessageRole } from '@/generated/prisma'
import React, { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import AssistantAvatar from './assistant-avatar'

interface MessageItemProps {
  type: MessageRole
}

const MessageLoader = ({ type }: MessageItemProps) => {
  const isAssistant = type !== MessageRole.USER
  const { data: session } = useSession()

  const roleMessages: Record<MessageRole, string[]> = {
    USER: ['Processing input...'],
    ASSISTANT: ['Thinking...', 'Analyzing context...', 'Preparing response...'],
    SYSTEM: ['Initializing...', 'Maintaining context...', 'Optimizing...'],
    BUSINESS_ANALYST: [
      'Thinking...',
      'Clarifying requirements...',
      'Analyzing needs...',
      'Refining insights...',
    ],
    PROJECT_MANAGER: [
      'Thinking...',
      'Reviewing scope...',
      'Estimating work...',
      'Organizing tasks...',
    ],
    SYSTEM_ARCHITECT: [
      'Thinking...',
      'Designing architecture...',
      'Analyzing flow...',
      'Documenting system...',
    ],
    DEVELOPER: [
      'Understanding task...',
      'Drafting logic...',
      'Writing code...',
      'Finalizing implementation...',
    ],
    TESTER: ['Preparing tests...', 'Checking flows...', 'Validating output...'],
    SECURITY_ANALYST: [
      'Scanning...',
      'Evaluating layers...',
      'Checking vulnerabilities...',
    ],
    DEV_OPS: [
      'Preparing pipelines...',
      'Configuring deployment...',
      'Ensuring reliability...',
    ],
  }

  const roleMessagesPastTense: Record<MessageRole, string[]> = {
    USER: ['Processed input'],
    ASSISTANT: ['Thought', 'Analyzed context', 'Prepared response'],
    SYSTEM: ['Initialized', 'Maintained context', 'Optimized'],
    BUSINESS_ANALYST: [
      'Thought',
      'Clarified requirements',
      'Analyzed needs',
      'Refined insights',
    ],
    PROJECT_MANAGER: [
      'Thought',
      'Reviewed scope',
      'Estimated work',
      'Organized tasks',
    ],
    SYSTEM_ARCHITECT: [
      'Thought',
      'Designed architecture',
      'Analyzed flow',
      'Documented system',
    ],
    DEVELOPER: [
      'Understood task',
      'Drafted logic',
      'Wrote code',
      'Finalized implementation',
    ],
    TESTER: ['Prepared tests', 'Checked flows', 'Validated output'],
    SECURITY_ANALYST: [
      'Scanned',
      'Evaluated layers',
      'Checked vulnerabilities',
    ],
    DEV_OPS: [
      'Prepared pipelines',
      'Configured deployment',
      'Ensured reliability',
    ],
  }

  const steps = roleMessages[type] || []
  const stepsPastTense = roleMessagesPastTense[type] || []
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    setCurrentStep(0)
  }, [type])

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [currentStep, steps.length])

  return (
    <div
      className={`flex items-start gap-4 ${
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAssistant
              ? 'bg-gray-100 dark:bg-gray-900'
              : 'bg-black dark:bg-gray-100'
          }`}
        >
          {isAssistant ? (
            <AssistantAvatar type={type} />
          ) : session?.user?.image ? (
            <img
              src={session.user.image}
              alt="User"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white dark:text-gray-950" />
          )}
        </div>
      </div>

      <div className="flex-1 max-w-[80%] space-y-2 mt-2">
        {type !== MessageRole.USER && (
          <p className="text-[10px] font-semibold text-gray-500">{type}</p>
        )}
        <div className="space-y-2">
          {steps.map((msg, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep

            return (
              <div
                key={index}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-green-500 dark:text-green-400"
                      fill="none"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <>
                      <div className="absolute w-5 h-5 rounded-full bg-blue-400 dark:bg-blue-500 animate-ping opacity-75" />
                      <div className="relative w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400" />
                    </>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  )}
                </div>

                <p
                  className={`text-sm font-medium transition-all duration-300 ${
                    isCompleted
                      ? 'text-neutral-500 dark:text-neutral-500 line-through'
                      : isCurrent
                      ? 'text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-400 dark:text-neutral-600'
                  }`}
                >
                  {isCompleted ? stepsPastTense[index] : msg}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MessageLoader
