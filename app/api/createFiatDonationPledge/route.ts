import { NextResponse } from 'next/server'
import axios from 'axios'
import prisma from '../../../lib/prisma'
import { getAccessToken } from '../../../utils/authTGB'
import Decimal from 'decimal.js'

interface GivingBlockPayload {
  organizationId: string
  isAnonymous: boolean
  pledgeAmount: string
  firstName: string
  lastName: string
  receiptEmail: string
  addressLine1: string
  addressLine2: string
  country: string
  state: string
  city: string
  zipcode: string
}

// Import a logging library (optional but recommended)
// Uncomment the following lines if you decide to use a logging library like Winston
// import logger from '../../../lib/logger';

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}` // Unique identifier for the request

  // Log the incoming request
  console.info(
    `[${requestId}] Incoming POST request to /api/createFiatDonationPledge`
  )
  // logger.info(`[${requestId}] Incoming POST request to /api/createFiatDonationPledge`)

  let body
  try {
    body = await request.json()
  } catch (error) {
    const errorMessage = 'Invalid JSON body'
    console.error(`[${requestId}] ${errorMessage} - Error: ${error}`)
    // logger.error(`[${requestId}] ${errorMessage} - Error: ${error}`)
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  const {
    // Project details
    organizationId,
    projectSlug,
    // Donation details
    pledgeCurrency,
    pledgeAmount,
    // Donor information
    receiptEmail,
    firstName,
    lastName,
    // Donor address details
    addressLine1,
    addressLine2,
    country,
    state,
    city,
    zipcode,
    // Donor settings
    taxReceipt,
    isAnonymous,
    joinMailingList,
    // Donor social profiles
    socialX,
    socialFacebook,
    socialLinkedIn,
  } = body

  // Validate required fields
  const missingFields: string[] = []
  if (!organizationId) missingFields.push('organizationId')
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
    const errorMessage = `Missing required fields: ${missingFields.join(', ')}`
    console.error(
      `[${requestId}] ${errorMessage} - Payload: ${JSON.stringify(body)}`
    )
    // logger.error(`[${requestId}] ${errorMessage} - Payload: ${JSON.stringify(body)}`)
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  const parsedOrganizationId = parseInt(organizationId, 10)
  if (isNaN(parsedOrganizationId)) {
    const errorMessage = 'Invalid organizationId: must be a number.'
    console.error(`[${requestId}] ${errorMessage} - Payload: ${JSON.stringify(body)}`)
    // logger.error(`[${requestId}] ${errorMessage} - Payload: ${JSON.stringify(body)}`)
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  try {
    const accessToken = await getAccessToken()
    console.info(`[${requestId}] Retrieved access token successfully.`)
    // logger.info(`[${requestId}] Retrieved access token successfully.`)

    // Validate pledgeAmount
    let parsedPledgeAmount: Decimal
    try {
      parsedPledgeAmount = new Decimal(pledgeAmount)
      if (parsedPledgeAmount.lte(0)) {
        throw new Error('Pledge amount must be greater than zero.')
      }
    } catch (validationError: unknown) {
      const message =
        validationError instanceof Error
          ? validationError.message
          : String(validationError)
      console.error(
        `[${requestId}] Invalid pledgeAmount: ${pledgeAmount} - Error: ${message}`
      )
      // logger.error(`[${requestId}] Invalid pledgeAmount: ${pledgeAmount} - Error: ${message}`)
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Create a new Donation record without pledgeId initially
    const donation = await prisma.donation.create({
      data: {
        // Project
        projectSlug: projectSlug,
        organizationId: parsedOrganizationId,
        // Donation
        donationType: 'fiat',
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
    console.info(
      `[${requestId}] Created Donation record with ID: ${donation.id}`
    )
    // logger.info(`[${requestId}] Created Donation record with ID: ${donation.id}`)

    // Prepare the payload for The Giving Block's CreateFiatDonationPledge API
    const apiPayload: GivingBlockPayload = {
      organizationId: organizationId.toString(), // required
      isAnonymous: isAnonymous, // required
      pledgeAmount: parsedPledgeAmount.toString(), // required
      firstName: firstName || ' ',
      lastName: lastName || ' ',
      receiptEmail: receiptEmail || ' ',
      addressLine1: addressLine1 || ' ',
      addressLine2: addressLine2 || ' ',
      country: country || ' ',
      state: state || ' ',
      city: city || ' ',
      zipcode: zipcode || ' ',
    }

    // Log the payload being sent (excluding sensitive information)
    const sanitizedPayload = { ...apiPayload }
    if (sanitizedPayload.receiptEmail) {
      sanitizedPayload.receiptEmail = sanitizedPayload.receiptEmail.replace(
        /(.{2})(.*)(?=@)/,
        (_: string, p1: string, p2: string) => p1 + '*'.repeat(p2.length)
      )
    }
    if (sanitizedPayload.firstName) {
      sanitizedPayload.firstName = sanitizedPayload.firstName.replace(/./g, '*')
    }
    if (sanitizedPayload.lastName) {
      sanitizedPayload.lastName = sanitizedPayload.lastName.replace(/./g, '*')
    }
    if (sanitizedPayload.addressLine1) {
      sanitizedPayload.addressLine1 = sanitizedPayload.addressLine1.replace(
        /./g,
        '*'
      )
    }
    if (sanitizedPayload.addressLine2) {
      sanitizedPayload.addressLine2 = sanitizedPayload.addressLine2.replace(
        /./g,
        '*'
      )
    }
    // console.debug(
    //   `[${requestId}] Payload sent to The Giving Block API: ${JSON.stringify(
    //     sanitizedPayload
    //   )}`
    // )
    // logger.debug(
    //   `[${requestId}] Payload sent to The Giving Block API: ${JSON.stringify(
    //     sanitizedPayload
    //   )}`
    // )

    // Call The Giving Block's CreateFiatDonationPledge API
    let tgbResponse
    try {
      tgbResponse = await axios.post(
        'https://public-api.tgbwidget.com/v1/donation/fiat',
        apiPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      console.info(
        `[${requestId}] Received response from The Giving Block API: ${JSON.stringify(
          tgbResponse.data
        )}`
      )
      // logger.info(`[${requestId}] Received response from The Giving Block API: ${JSON.stringify(tgbResponse.data)}`)
    } catch (apiError: unknown) {
      if (axios.isAxiosError(apiError)) {
        console.error(
          `[${requestId}] Axios error from The Giving Block API: ${
            apiError.response?.data || apiError.message
          }`
        )
        // logger.error(
        //   `[${requestId}] Axios error from The Giving Block API: ${
        //     apiError.response?.data || apiError.message
        //   }`
        // )
        throw apiError
      } else {
        const message =
          apiError instanceof Error ? apiError.message : String(apiError)
        console.error(
          `[${requestId}] Unexpected error when calling The Giving Block API: ${message}`
        )
        // logger.error(
        //   `[${requestId}] Unexpected error when calling The Giving Block API: ${message}`
        // )
        throw new Error(message)
      }
    }

    // Check if the response has the expected data
    if (
      !tgbResponse.data ||
      !tgbResponse.data.data ||
      !tgbResponse.data.data.pledgeId
    ) {
      const errorDetail =
        'Invalid response structure from The Giving Block API.'
      console.error(
        `[${requestId}] ${errorDetail} - Response: ${JSON.stringify(
          tgbResponse.data
        )}`
      )
      // logger.error(`[${requestId}] ${errorDetail} - Response: ${JSON.stringify(tgbResponse.data)}`)
      throw new Error(errorDetail)
    }

    const { pledgeId } = tgbResponse.data.data

    // Update the Donation record with the returned pledgeId
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        pledgeId: pledgeId,
      },
    })
    console.info(
      `[${requestId}] Updated Donation record ID ${donation.id} with pledgeId: ${pledgeId}`
    )
    // logger.info(`[${requestId}] Updated Donation record ID ${donation.id} with pledgeId: ${pledgeId}`)

    return NextResponse.json({ pledgeId }, { status: 200 })
  } catch (error: unknown) {
    // Enhanced error logging
    if (axios.isAxiosError(error)) {
      console.error(
        `[${requestId}] Axios error creating fiat donation pledge: ${
          error.response?.data || error.message
        }`
      )
      // logger.error(`[${requestId}] Axios error creating fiat donation pledge: ${
      //   error.response?.data || error.message
      // }`)
      const errorData = error.response?.data as
        | { error?: string; message?: string }
        | undefined
      return NextResponse.json(
        {
          error:
            errorData?.error ||
            errorData?.message ||
            `Bad Request: ${error.message}`,
        },
        { status: 400 }
      )
    } else {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[${requestId}] Internal Server Error: ${message}`)
      // logger.error(`[${requestId}] Internal Server Error: ${message}`)
      return NextResponse.json(
        { error: `Internal Server Error: ${message}` },
        { status: 500 }
      )
    }
  }
}
