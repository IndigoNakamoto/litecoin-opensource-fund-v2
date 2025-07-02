import { NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '@/utils/authTGB'

export async function POST() {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      console.error('Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Match the Python script by sending an empty payload
    const payload = {}

    const response = await axios.post(
      'https://public-api.tgbwidget.com/v1/currencies/list',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Ensure the response has the expected structure
    if (response.data && Array.isArray(response.data.data)) {
      return NextResponse.json(response.data.data)
    } else {
      console.error('Unexpected response structure:', response.data)
      return NextResponse.json(
        { error: 'Unexpected response structure' },
        { status: 500 }
      )
    }
  } catch (error) {
    // Enhanced error logging
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.response?.data || error.message)
      return NextResponse.json(
        {
          error: error.response?.data?.error || 'Internal Server Error',
        },
        { status: error.response?.status || 500 }
      )
    } else {
      console.error('Unknown error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
}
