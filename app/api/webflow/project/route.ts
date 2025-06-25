import { NextRequest, NextResponse } from 'next/server'
import { getProjectBySlug } from '@/utils/webflow'

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

    const project = await getProjectBySlug(slug)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}
