'use server'

import axios from 'axios'

interface LLMConversation {
  type: string
  role: string
  content: string
}

const businessAnalyst = async (
  conversation: LLMConversation[],
  model: string
) => {
  try {
    const response = await axios.post(
      `${process.env.AGENTS_API_BASE_URL}/agents/ba`,
      { conversation, model },
      {
        headers: {
          Authorization: `Bearer ${process.env.AGENT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error) {
    console.error('Error in businessAnalyst:')
    throw new Error('Failed to process request')
  }
}

export default businessAnalyst
