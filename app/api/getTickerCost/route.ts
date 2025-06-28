import { NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '../../../utils/authTGB'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')

  if (!ticker || typeof ticker !== 'string') {
    return NextResponse.json(
      { error: 'Ticker symbol is required' },
      { status: 400 }
    )
  }

  try {
    const accessToken = await getAccessToken() // Retrieve The Giving Block access token

    if (!accessToken) {
      console.error('Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await axios.get(
      'https://public-api.tgbwidget.com/v1/stocks/ticker-cost',
      {
        params: { ticker },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    // Handle errors
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data
      const errorMessage = error.message
      console.error('Error fetching ticker cost:', errorData || errorMessage)
      return NextResponse.json(
        { error: errorData || 'Internal Server Error' },
        { status: 500 }
      )
    } else if (error instanceof Error) {
      console.error('Error fetching ticker cost:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
