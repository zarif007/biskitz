'use client'

import type React from 'react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function HireForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [fieldStates, setFieldStates] = useState({
    name: false,
    email: false,
    company: false,
    role: false,
    message: false,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFieldStates({
        name: false,
        email: false,
        company: false,
        role: false,
        message: false,
      })
      ;(e.target as HTMLFormElement).reset()
    }, 3000)
  }

  const handleFieldChange = (
    field: keyof typeof fieldStates,
    value: string
  ) => {
    setFieldStates((prev) => ({ ...prev, [field]: value.length > 0 }))
  }

  return (
    <div className="relative rounded-2xl border border-border/50 bg-background/40 backdrop-blur-xl shadow-2xl p-8 md:p-10 lg:p-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative">
            <div className="relative rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <input
                id="name"
                name="name"
                required
                className="w-full bg-transparent px-4 pt-6 pb-2 text-base outline-none"
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <label
                htmlFor="name"
                className={`absolute left-4 text-muted-foreground transition-all pointer-events-none ${
                  fieldStates.name
                    ? 'top-2 translate-y-0 text-xs'
                    : 'top-1/2 -translate-y-1/2 text-base'
                }`}
              >
                Your Name *
              </label>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-transparent px-4 pt-6 pb-2 text-base outline-none"
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
              <label
                htmlFor="email"
                className={`absolute left-4 text-muted-foreground transition-all pointer-events-none ${
                  fieldStates.email
                    ? 'top-2 translate-y-0 text-xs'
                    : 'top-1/2 -translate-y-1/2 text-base'
                }`}
              >
                Email Address *
              </label>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <input
              id="company"
              name="company"
              className="w-full bg-transparent px-4 pt-6 pb-2 text-base outline-none"
              onChange={(e) => handleFieldChange('company', e.target.value)}
            />
            <label
              htmlFor="company"
              className={`absolute left-4 text-muted-foreground transition-all pointer-events-none ${
                fieldStates.company
                  ? 'top-2 translate-y-0 text-xs'
                  : 'top-1/2 -translate-y-1/2 text-base'
              }`}
            >
              Company / Organization
            </label>
          </div>
        </div>

        <div className="relative">
          <div className="relative rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <input
              id="role"
              name="role"
              required
              className="w-full bg-transparent px-4 pt-6 pb-2 text-base outline-none"
              onChange={(e) => handleFieldChange('role', e.target.value)}
            />
            <label
              htmlFor="role"
              className={`absolute left-4 text-muted-foreground transition-all pointer-events-none ${
                fieldStates.role
                  ? 'top-2 translate-y-0 text-xs'
                  : 'top-1/2 -translate-y-1/2 text-base'
              }`}
            >
              Position / Role *
            </label>
          </div>
        </div>

        <div className="relative">
          <div className="relative rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full bg-transparent px-4 pt-6 pb-2 text-base outline-none resize-none"
              onChange={(e) => handleFieldChange('message', e.target.value)}
            />
            <label
              htmlFor="message"
              className={`absolute left-4 text-muted-foreground transition-all pointer-events-none ${
                fieldStates.message
                  ? 'top-2 translate-y-0 text-xs'
                  : 'top-6 translate-y-0 text-base'
              }`}
            >
              Message
            </label>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || isSubmitted}
          className="w-full h-14 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </span>
          ) : isSubmitted ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Request Sent!
            </span>
          ) : (
            'Send Resume Request'
          )}
        </Button>

        {isSubmitted && (
          <p className="text-center text-sm text-accent font-medium animate-in fade-in slide-in-from-bottom-2 duration-500">
            Thanks! Check your email for my resume shortly.
          </p>
        )}
      </form>
    </div>
  )
}
