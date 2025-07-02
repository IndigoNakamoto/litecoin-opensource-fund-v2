import { NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '../../../utils/authTGB'

export async function GET() {
  try {
    const accessToken = await getAccessToken() // Retrieve The Giving Block access token

    if (!accessToken) {
      console.error('Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await axios.get(
      'https://public-api.tgbwidget.com/v1/stocks/brokers',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    // Handle errors
    let errorMessage = 'Internal Server Error'
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data
      console.error('Error fetching brokers:', errorMessage)
    } else if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error fetching brokers:', errorMessage)
    } else {
      console.error('An unexpected error occurred:', error)
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
