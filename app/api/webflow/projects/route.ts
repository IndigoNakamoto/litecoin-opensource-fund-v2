import { NextResponse } from 'next/server'
import { getAllProjects } from '@/utils/webflow'

export async function GET() {
  try {
    const projects = await getAllProjects()
    const filteredProjects = projects.filter((project) => !project.isDraft)

    return NextResponse.json({ projects: filteredProjects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
