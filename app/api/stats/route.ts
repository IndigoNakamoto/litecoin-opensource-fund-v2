import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getAllProjects, ProjectSummaryLite } from '../../../utils/webflow' // Adjust the path as necessary
import { kv } from '@vercel/kv'
// import { Prisma } from '@prisma/client' // Import Prisma to access Decimal type

interface Stats {
  projectsSupported: number
  totalPaid: number
  donationsRaised: number
  donationsMatched: number
}

const fetchTotalPaidFromWebflow = async (): Promise<number> => {
  const cacheKey = 'stats:totalPaid2'
  const cachedTotalPaid = await kv.get<number>(cacheKey)

  if (cachedTotalPaid !== null && cachedTotalPaid !== undefined) {
    return cachedTotalPaid
  }

  try {
    const projects: ProjectSummaryLite[] = await getAllProjects()
    // Assuming 'total-paid' is a number in each project's fieldData
    const totalPaid = projects.reduce((acc, project) => {
      const paid = project.fieldData['total-paid']
      return acc + (typeof paid === 'number' ? paid : 0)
    }, 0)

    // Cache the totalPaid for 10 minutes (600 seconds)
    await kv.set(cacheKey, totalPaid, { ex: 600 })

    return totalPaid
  } catch (error) {
    console.error('Error fetching totalPaid from Webflow:', error)
    throw new Error('Failed to fetch totalPaid')
  }
}

export async function GET() {
  try {
    // Fetch projectsSupported and totalPaid in parallel
    const [projectsSupported, totalPaidNumber] = await Promise.all([
      // GroupBy to get distinct projects supported
      prisma.donation
        .groupBy({
          by: ['projectSlug'],
        })
        .then((grouped) => grouped.length),

      fetchTotalPaidFromWebflow(),
    ])

    // Fetch donationsRaised and donationsMatched in parallel
    const [donationsRaisedResult, donationsMatchedResult] = await Promise.all([
      prisma.donation.aggregate({
        _sum: {
          valueAtDonationTimeUSD: true,
        },
        where: {
          success: true,
        },
      }),
      prisma.matchingDonationLog.aggregate({
        _sum: {
          matchedAmount: true,
        },
      }),
    ])

    // Convert Decimal values to numbers
    const donationsRaised =
      donationsRaisedResult._sum.valueAtDonationTimeUSD?.toNumber() ?? 0
    const donationsMatched =
      donationsMatchedResult._sum.matchedAmount?.toNumber() ?? 0

    const stats: Stats = {
      projectsSupported,
      totalPaid: totalPaidNumber,
      donationsRaised,
      donationsMatched,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
