'use client'

import { Header } from '@/components/Header'
import { HireForm } from '@/components/hire-form'
import React from 'react'

const Career = () => {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 mt-8">
      <Header />
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 text-balance tracking-tight">
            Hire me instead
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto text-balance leading-relaxed">
            Fill up the form below and I'll send you an email with my resume and
            portfolio details
          </p>
        </div>

        <HireForm />
      </div>
    </main>
  )
}

export default Career
