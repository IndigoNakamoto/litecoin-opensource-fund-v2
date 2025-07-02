import { NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '../../../utils/authTGB'

export async function POST(req: Request) {
  const {
    donationUuid,
    brokerName,
    brokerageAccountNumber,
    brokerContactName,
    brokerEmail,
    brokerPhone,
  } = await req.json()

  if (!donationUuid || !brokerName || !brokerageAccountNumber) {
    const missingFields: string[] = []
    if (!donationUuid) missingFields.push('donationUuid')
    if (!brokerName) missingFields.push('brokerName')
    if (!brokerageAccountNumber) missingFields.push('brokerageAccountNumber')
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(', ')}` },
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
      'https://public-api.tgbwidget.com/v1/stocks/submit',
      {
        donationUuid,
        brokerName,
        brokerageAccountNumber,
        brokerContactName,
        brokerEmail,
        brokerPhone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    // Handle errors
    let errorMessage = 'Internal Server Error'
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data
      console.error('Error submitting stock donation:', errorMessage)
    } else if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error submitting stock donation:', errorMessage)
    } else {
      console.error('An unexpected error occurred:', error)
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
