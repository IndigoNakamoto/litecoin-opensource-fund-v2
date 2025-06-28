import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  // Authenticate the request using Authorization header
  const authHeader = req.headers.get('authorization')
  const expectedAuthHeader = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedAuthHeader) {
    console.log(`[${new Date().toISOString()}] Unauthorized access attempt`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all keys from the KV store using a wildcard pattern
    const keys = await kv.keys('*')

    if (keys.length === 0) {
      console.log(`[${new Date().toISOString()}] KV store is already empty.`)
      return NextResponse.json({ message: 'KV store is already empty.' })
    }

    console.log(
      `[${new Date().toISOString()}] Retrieved ${
        keys.length
      } keys. Starting deletion.`
    )

    // Define batch size to handle large numbers of keys
    const BATCH_SIZE = 100

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map((key) => kv.del(key)))
      console.log(
        `[${new Date().toISOString()}] Deleted batch ${
          i / BATCH_SIZE + 1
        }`
      )
    }

    console.log(
      `[${new Date().toISOString()}] All KV data cleared successfully.`
    )
    return NextResponse.json({
      message: 'All KV data cleared successfully.',
    })
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] Error clearing KV:`, error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json(
      {
        error: 'Failed to clear KV data.',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
