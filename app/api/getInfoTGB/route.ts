import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import Decimal from 'decimal.js'
import { Donation } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ message: 'Slug is required' }, { status: 400 })
  }

  try {
    const donations: Donation[] = await prisma.donation.findMany({
      where: {
        projectSlug: slug,
        status: {
          in: ['Complete', 'Advanced'], // Filter donations with 'Complete' or 'Advanced' status
        },
      },
    })

    if (!donations || donations.length === 0) {
      return NextResponse.json({
        funded_txo_sum: 0,
        tx_count: 0,
        supporters: [],
        donatedCreatedTime: [],
      })
    }

    // Sum of all donation amounts using Decimal for precision
    const totalAmount = donations.reduce((acc, donation) => {
      const donationAmount = donation.valueAtDonationTimeUSD
        ? new Decimal(donation.valueAtDonationTimeUSD.toString() || '0')
        : new Decimal(0)
      return acc.plus(donationAmount)
    }, new Decimal(0))

    // Unified supporter list
    const supporters: string[] = []

    donations.forEach((donation) => {
      if (donation.socialX) {
        supporters.push(`${donation.socialX}`)
      }
    })

    // Donation amounts with creation timestamps
    const donatedCreatedTime = donations.map((donation) => ({
      valueAtDonationTimeUSD: donation.valueAtDonationTimeUSD
        ? parseFloat(donation.valueAtDonationTimeUSD?.toString())
        : 0,
      createdTime: donation.createdAt.toISOString(),
    }))

    return NextResponse.json({
      funded_txo_sum: totalAmount.toNumber(),
      tx_count: donations.length,
      supporters: supporters,
      donatedCreatedTime: donatedCreatedTime,
    })
  } catch (err) {
    console.error('Error fetching donation info:', err)
    return NextResponse.json(
      { message: (err as Error).message },
      { status: 500 }
    )
  }
}
