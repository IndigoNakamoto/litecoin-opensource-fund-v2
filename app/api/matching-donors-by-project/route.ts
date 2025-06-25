import { getMatchingDonorsByProjectSlug } from '../../../utils/webflow'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Project slug is required' },
        { status: 400 }
      )
    }

    // Fetch the matching donors for the project
    const donorsWithMatchedAmounts = await getMatchingDonorsByProjectSlug(slug)

    return NextResponse.json(donorsWithMatchedAmounts)
  } catch (error) {
    console.error('Error fetching matching donors by project slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matching donors' },
      { status: 500 }
    )
  }
}
