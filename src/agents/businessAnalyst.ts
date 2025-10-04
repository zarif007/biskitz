'use server'

import axios from 'axios'

const businessAnalyst = async (prompt: string) => {
  try {
    const response = await axios.post(
      `${process.env.AGENTS_API_BASE_URL}/agents/ba`,
      { prompt },
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
