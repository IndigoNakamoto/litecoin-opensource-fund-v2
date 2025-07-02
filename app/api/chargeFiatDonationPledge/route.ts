import { NextRequest, NextResponse } from 'next/server'
import axios, { isAxiosError } from 'axios'
import prisma from '@/lib/prisma' // Assuming prisma is in lib
import { getAccessToken } from '@/utils/authTGB' // Assuming authTGB is in utils

export async function POST(req: NextRequest) {
  const { pledgeId, cardToken } = await req.json()

  // Basic validation
  if (!pledgeId || !cardToken) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    )
  }

  try {
    const accessToken = await getAccessToken()

    // Charge the pledge via The Giving Block's API
    const chargeResponse = await axios.post(
      'https://public-api.tgbwidget.com/v1/donation/fiat/charge',
      { pledgeId, cardToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const { success } = chargeResponse.data.data

    // Update the donation record in Prisma with success status
    try {
      await prisma.donation.update({
        where: { pledgeId },
        data: { success: success || false },
      })
    } catch (prismaError) {
      console.error('Error updating donation status in Prisma:', prismaError)
      return NextResponse.json(
        { error: 'Failed to update donation record' },
        { status: 500 }
      )
    }

    // Return success response to the frontend
    return NextResponse.json({ success })
  } catch (error) {
    let errorMessage = 'An unknown error occurred'
    if (isAxiosError(error)) {
      errorMessage =
        error.response?.data?.data?.meta?.message ||
        'An unknown API error occurred'
      console.error(
        'Error charging fiat donation pledge:',
        errorMessage,
        error.response?.data
      )
    } else {
      console.error('An unexpected error occurred:', error)
      if (error instanceof Error) {
        errorMessage = error.message
      }
    }

    // Attempt to update the donation record with failure status
    try {
      await prisma.donation.update({
        where: { pledgeId },
        data: { success: false },
      })
    } catch (prismaError) {
      console.error(
        'Error updating donation failure status in Prisma:',
        prismaError
      )
    }

    // Return a more descriptive error message to the frontend if applicable
    if (
      isAxiosError(error) &&
      error.response?.data?.errorType === 'err.generic'
    ) {
      return NextResponse.json(
        {
          error: errorMessage,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
