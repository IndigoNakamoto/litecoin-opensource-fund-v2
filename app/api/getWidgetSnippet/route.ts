import { NextResponse } from 'next/server'
import axios from 'axios'
import { getAccessToken } from '../../../utils/authTGB'

export async function GET() {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      console.error('Access token is missing.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = '1189134331' // Ensure this is your correct organization ID
    const apiUrl = `https://public-api.tgbwidget.com/v1/organization/${organizationId}/widget-snippet`

    const requestBody = {
      uiVersion: 2,
      donationFlow: ['daf'],
      button: {
        id: 'tgb-widget-button',
        text: 'DAF',
        style: `
          width: 100%; /* Added width */
          height: 100%; /* Added height */
          font-family: "Space Grotesk", "Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif;
          color: #222222;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s;
          transform: translateY(0px);
          cursor: pointer; /* Optional: Change cursor on hover */
        `,
      },
      scriptId: 'tgb-widget-script',
      campaignId: 'LitecoinWebsiteDAF',
    }

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json(response.data.data)
  } catch (error: unknown) {
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
