'use server'

import axios from 'axios'

interface LLMConversation {
  type: string
  role: string
  content: string
}

const systemArchitect = async (
  conversation: LLMConversation[],
  model: string
) => {
  try {
    const response = await axios.post(
      `${process.env.AGENTS_API_BASE_URL}/agents/system-architect`,
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
    console.error('Error in systemArchitect:')
    throw new Error('Failed to process request')
  }
}

export default systemArchitect
