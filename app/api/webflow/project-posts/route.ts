import { NextRequest, NextResponse } from 'next/server'
import { getPostsByProjectIdLocal } from '@/utils/webflow'

/**
 * Replaces the comment section. Returns X, Reddit, and YouTube links.
 *
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    // Ensure the projectId is provided
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Project projectId is required' },
        { status: 400 }
      )
    }

    // Fetch the posts by projectId
    const posts = await getPostsByProjectIdLocal(projectId)

    // If the posts are not found, return a 404 response
    if (!posts) {
      return NextResponse.json(
        { error: `Posts for project with id(${projectId}) not found` },
        { status: 404 }
      )
    }

    // Respond with the project data
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching project posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project posts' },
      { status: 500 }
    )
  }
}
