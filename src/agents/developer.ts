'use server'

import axios from 'axios'

interface LLMConversation {
  type: string
  role: string
  content: string
}

const developer = async (
  conversation: LLMConversation[],
  currentFolder: { [path: string]: string },
  tddEnabled: boolean,
  model: string
) => {
  try {
    const response = await axios.post(
      `${process.env.AGENTS_API_BASE_URL}/agents/developer`,
      {
        conversation,
        current_folder: currentFolder,
        tdd_enabled: tddEnabled,
        model,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AGENT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Error in developer:', error.response?.data || error.message)
    throw new Error(
      error.response?.data?.message || 'Failed to process request'
    )
  }
}

export default developer
