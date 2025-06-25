/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getAllActiveContributors } from '../../../utils/webflow' // Adjust the path as necessary
import { kv } from '@vercel/kv'

const fetchContributors = async (): Promise<any> => {
  const cacheKey = 'contributors:all'
  const cachedContributors = await kv.get<any>(cacheKey)

  if (cachedContributors !== null && cachedContributors !== undefined) {
    return cachedContributors
  }

  try {
    const contributors = await getAllActiveContributors()
    // Cache the contributors for a certain period, e.g., 10 minutes
    await kv.set(cacheKey, contributors, { ex: 600 })
    return contributors
  } catch (error) {
    console.error('Error fetching all active contributors', error)
    throw new Error('Failed to fetch all contributors')
  }
}

export async function GET() {
  try {
    const contributors = await fetchContributors()
    return NextResponse.json(contributors)
  } catch (error) {
    console.error('Error in getContributors handler:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
