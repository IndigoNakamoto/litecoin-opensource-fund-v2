import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import axios from 'axios'
import { getAccessToken } from '@/utils/authTGB'
import Decimal from 'decimal.js'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    // project
    organizationId,
    projectSlug,
    // Donation
    pledgeCurrency,
    pledgeAmount,
    // Donor Info
    receiptEmail,
    firstName,
    lastName,
    /// Donor Personal Info
    addressLine1,
    addressLine2,
    country,
    state,
    city,
    zipcode,
    // Donor Settings
    taxReceipt,
    isAnonymous,
    joinMailingList,
    // Donor Social Profiles
    socialX,
    socialFacebook,
    socialLinkedIn,
  } = body

  // Validate always required fields
  const missingFields: string[] = []
  if (organizationId === undefined || organizationId === null)
    missingFields.push('organizationId')
  const parsedOrganizationId = parseInt(organizationId, 10)
  if (isNaN(parsedOrganizationId)) {
    return NextResponse.json(
      { error: 'Invalid organizationId. Must be an integer.' },
      { status: 400 }
    )
  }
  if (!pledgeCurrency) missingFields.push('pledgeCurrency')
  if (!pledgeAmount) missingFields.push('pledgeAmount')
  if (!projectSlug) missingFields.push('projectSlug')

  // If donation is not anonymous, validate additional fields
  if (isAnonymous === false) {
    if (!firstName) missingFields.push('firstName')
    if (!lastName) missingFields.push('lastName')
    if (!addressLine1) missingFields.push('addressLine1')
    if (!country) missingFields.push('country')
    if (!state) missingFields.push('state')
    if (!city) missingFields.push('city')
    if (!zipcode) missingFields.push('zipcode')
  }

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const accessToken = await getAccessToken()

    // Validate pledgeAmount
    const parsedPledgeAmount = new Decimal(pledgeAmount)
    if (parsedPledgeAmount.lte(0)) {
      return NextResponse.json(
        { error: 'Pledge amount must be greater than zero.' },
        { status: 400 }
      )
    }

    // Create a new Donation record without pledgeId initially
    const donation = await prisma.donation.create({
      data: {
        // Project
        projectSlug: projectSlug,
        organizationId: parsedOrganizationId,
        // Donation
        donationType: 'crypto',
        assetSymbol: pledgeCurrency,
        pledgeAmount: parsedPledgeAmount,
        // Donor Info
        firstName: firstName || null,
        lastName: lastName || null,
        donorEmail: receiptEmail || null,
        // Donor Settings
        isAnonymous: isAnonymous || false,
        taxReceipt: taxReceipt || false,
        joinMailingList: joinMailingList || false,
        // Donor Social Profiles
        socialX: socialX || null,
        socialFacebook: socialFacebook || null,
        socialLinkedIn: socialLinkedIn || null,
      },
    })

    // Prepare the payload for The Giving Block's CreateDepositAddress API
    const apiPayload: {
      organizationId: number
      isAnonymous: boolean
      pledgeCurrency: string
      pledgeAmount: string
      receiptEmail: string | null
      firstName?: string
      lastName?: string
      addressLine1?: string
      addressLine2?: string
      country?: string
      state?: string
      city?: string
      zipcode?: string
    } = {
      organizationId: parsedOrganizationId,
      isAnonymous: isAnonymous,
      pledgeCurrency: pledgeCurrency,
      pledgeAmount: parsedPledgeAmount.toString(), // Convert to string
      receiptEmail: receiptEmail,
    }

    // If the donation is not anonymous, include all required donor fields
    if (isAnonymous === false) {
      apiPayload.firstName = firstName
      apiPayload.lastName = lastName
      apiPayload.addressLine1 = addressLine1
      apiPayload.addressLine2 = addressLine2
      apiPayload.country = country
      apiPayload.state = state
      apiPayload.city = city
      apiPayload.zipcode = zipcode
    }

    // Call The Giving Block's CreateDepositAddress API
    const tgbResponse = await axios.post(
      'https://public-api.tgbwidget.com/v1/deposit-address',
      apiPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Check if the response has the expected data
    if (
      !tgbResponse.data ||
      !tgbResponse.data.data ||
      !tgbResponse.data.data.depositAddress ||
      !tgbResponse.data.data.pledgeId ||
      !tgbResponse.data.data.qrCode
    ) {
      return NextResponse.json(
        { error: 'Invalid response from external API.' },
        { status: 500 }
      )
    }

    const { depositAddress, pledgeId, qrCode } = tgbResponse.data.data

    // Update the Donation record with pledgeId and depositAddress
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        pledgeId: pledgeId,
        depositAddress: depositAddress,
      },
    })

    return NextResponse.json({ depositAddress, pledgeId, qrCode })
  } catch (error: unknown) {
    // Enhanced error logging
    if (axios.isAxiosError(error)) {
      console.error(
        'Axios error creating crypto donation pledge:',
        error.response?.data || error.message
      )
      return NextResponse.json(
        {
          error:
            error.response?.data?.error ||
            error.response?.data?.message ||
            `Bad Request: ${error.message}`,
        },
        { status: 400 }
      )
    } else {
      const message =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during pledge creation.'
      console.error('Error creating crypto donation pledge:', error)
      return NextResponse.json(
        { error: `Internal Server Error: ${message}` },
        { status: 500 }
      )
    }
  }
}
