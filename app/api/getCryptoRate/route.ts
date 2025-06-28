import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '../../../utils/authTGB'

export async function GET(req: NextRequest) {
  const currency = req.nextUrl.searchParams.get('currency')

  if (!currency) {
    return NextResponse.json(
      { message: 'Currency code is required' },
      { status: 400 }
    )
  }

  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      console.error('Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await axios.get(
      'https://public-api.tgbwidget.com/v1/crypto-to-usd-rate',
      {
        params: { currency },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error) {
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
