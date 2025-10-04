'use server'

import axios from 'axios'

const developer = async (
  prompt: string,
  currentFolder: { [path: string]: string },
  tddEnabled: boolean
) => {
  try {
    const response = await axios.post(
      `${process.env.AGENTS_API_BASE_URL}/agents/developer`,
      {
        prompt,
        current_folder: currentFolder,
        tdd_enabled: tddEnabled,
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
