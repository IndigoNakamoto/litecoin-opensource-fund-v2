import { NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '../../../utils/authTGB'

export async function POST(req: Request) {
  const { donationUuid, date, signature } = await req.json()

  // Check for missing fields and return specific errors
  if (!donationUuid) {
    return NextResponse.json(
      { error: 'Missing field: donationUuid' },
      { status: 400 }
    )
  }

  if (!date) {
    return NextResponse.json({ error: 'Missing field: date' }, { status: 400 })
  }

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing field: signature' },
      { status: 400 }
    )
  }

  try {
    const accessToken = await getAccessToken() // Retrieve The Giving Block access token

    if (!accessToken) {
      console.error('Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await axios.post(
      'https://public-api.tgbwidget.com/v1/stocks/sign',
      {
        donationUuid,
        date,
        signature,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
    // Handle errors
    if (axios.isAxiosError(error)) {
      console.error(
        'Error signing donation:',
        error.response?.data || error.message
      )
      return NextResponse.json(
        { error: error.response?.data || 'Internal Server Error' },
        { status: 500 }
      )
    } else if (error instanceof Error) {
      console.error('Error signing donation:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.error('Error signing donation:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
