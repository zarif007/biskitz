'use server'

import { generateText, stepCountIs, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import TESTER_AGENT_PROMPT from '@/constants/systemPrompts/tester'

interface CodeGenState {
  files: { [path: string]: string }
  summary?: string
}

const tester = async (prompt: string) => {
  const conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }> = [{ role: 'user', content: prompt.trim() }]

  const state: CodeGenState = {
    files: {},
  }

  // ---- Tools ----
  const createOrUpdateFilesTool = tool({
    description: 'Create or update files for the npm package.',
    inputSchema: z.object({
      files: z.array(
        z.object({
          path: z
            .string()
            .describe('Path of the file (e.g. index.ts, package.json)'),
          content: z.string().describe('File content'),
        })
      ),
    }),
    execute: async ({ files }) => {
      for (const file of files) {
        state.files[file.path] = file.content
      }
      return state.files
    },
  })

  const readFilesTool = tool({
    description: 'Read files already generated in the project.',
    inputSchema: z.object({
      files: z.array(z.string()).describe('Paths of files to read'),
    }),
    execute: async ({ files }) => {
      return files.map((file) => ({
        path: file,
        content: state.files[file] || null,
      }))
    },
  })

  try {
    const result = await generateText({
      model: openai('gpt-4.1-mini'),
      system: TESTER_AGENT_PROMPT,
      messages: conversationHistory,
      tools: {
        createOrUpdateFiles: createOrUpdateFilesTool,
        readFiles: readFilesTool,
      },
      stopWhen: stepCountIs(2),
    })

    return { res: result.text, state }
  } catch {}
}

export default tester
