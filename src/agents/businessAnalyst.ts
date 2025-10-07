'use server'

import axios from 'axios'

interface LLMConversation {
  type: string
  role: string
  content: string
}

const businessAnalyst = async (conversation: LLMConversation[]) => {
  try {
    const response = await axios.post(
      `${process.env.AGENTS_API_BASE_URL}/agents/ba`,
      { conversation },
      {
        headers: {
          Authorization: `Bearer ${process.env.AGENT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error(
      'Error in businessAnalyst:',
      error.response?.data || error.message
    )
    throw new Error(
      error.response?.data?.message || 'Failed to process request'
    )
  }
}

export default businessAnalyst
