import { notFound } from 'next/navigation'
import {
  getProjectBySlug,
  getProjectUpdatesBySlug,
  getFAQsByProjectSlug,
  getPostsBySlug,
  getAllActiveContributors,
  getAllProjects,
} from '@/utils/webflow'
import {
  ProjectFieldData,
  ProjectItem,
  ProjectUpdate,
  WebflowProjectUpdate,
} from '@/utils/types'
import React from 'react'
import {
  determineProjectType,
  determineBountyStatus,
} from '@/utils/statusHelpers'
import ProjectClient from '@/components/ProjectClient'

type SingleProjectPageProps = {
  params: { slug: string }
}

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map((project) => ({
    slug: project.fieldData.slug,
  }))
}

const ProjectPage = async ({ params }: SingleProjectPageProps) => {
  const { slug } = await params

  const projectData = await (async () => {
    const project = await getProjectBySlug(slug)
    if (!project) {
      return null
    }

    const updates: ProjectUpdate[] = (
      await getProjectUpdatesBySlug(slug)
    ).map((update: WebflowProjectUpdate) => {
      const fieldData = update.fieldData
      return {
        id: parseInt(update.id, 10),
        date: fieldData.date || new Date().toISOString(),
        authorTwitterHandle:
          (fieldData['author-twitter-handle'] as string) || '',
        content: fieldData.content || '',
        title: fieldData.title || '',
        summary: fieldData.summary || '',
      }
    })
    const faqs = await getFAQsByProjectSlug(slug)
    const posts = await getPostsBySlug(slug)
    const allContributors = await getAllActiveContributors()

    const contributorsBitcoinIds =
      (project.fieldData as ProjectFieldData)['bitcoin-contributors'] || []
    const contributorsLitecoinIds =
      (project.fieldData as ProjectFieldData)['litecoin-contributors'] || []
    const advocateIds =
      (project.fieldData as ProjectFieldData)['advocates'] || []

    const contributorsBitcoin = allContributors.filter((contributor) =>
      contributorsBitcoinIds.includes(contributor.id)
    )
    const contributorsLitecoin = allContributors.filter((contributor) =>
      contributorsLitecoinIds.includes(contributor.id)
    )
    const advocates = allContributors.filter((contributor) =>
      advocateIds.includes(contributor.id)
    )

    const status = project.fieldData.status || ''
    const projectType = determineProjectType(status)
    const bountyStatus = determineBountyStatus(status) ?? null

    return {
      project: {
        ...project.fieldData,
        title: project.fieldData.name || '',
        slug: project.fieldData.slug,
        content: (project.fieldData as ProjectFieldData)['content'] || '',
        summary: (project.fieldData as ProjectFieldData)['summary'] || '',
        socialSummary:
          (project.fieldData as ProjectFieldData)['social-summary'] || '',
        coverImage:
          (project.fieldData as ProjectFieldData)['cover-image']?.url || '',
        gitRepository:
          (project.fieldData as ProjectFieldData)['github-link'] || '',
        twitterHandle:
          (project.fieldData as ProjectFieldData)['twitter-link'] || '',
        discordLink:
          (project.fieldData as ProjectFieldData)['discord-link'] || '',
        telegramLink:
          (project.fieldData as ProjectFieldData)['telegram-link'] || '',
        redditLink:
          (project.fieldData as ProjectFieldData)['reddit-link'] || '',
        facebookLink:
          (project.fieldData as ProjectFieldData)['facebook-link'] || '',
        website: (project.fieldData as ProjectFieldData)['website-link'] || '',
        hidden: project.fieldData.hidden || false,
        isRecurring: project.fieldData.recurring || false,
        isMatching: (project.fieldData as ProjectFieldData)['is-matching'] || false,
        matchingMultiplier: (project.fieldData as ProjectFieldData)['matching-multiplier'] || 0,
        isBitcoinOlympics2024: (project.fieldData as ProjectFieldData)['is-bitcoin-olympics-2024'] || false,
        totalPaid: project.fieldData['total-paid'] || 0,
        serviceFeesCollected:
          project.fieldData['service-fees-collected'] || null,
        type: projectType,
        bountyStatus: bountyStatus,
        contributorsBitcoin:
          contributorsBitcoin
            .map((c: { fieldData: { 'twitter-link': string } }) =>
              c.fieldData['twitter-link'].replace(
                /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//,
                ''
              )
            )
            .join(',') || '',
        contributorsLitecoin:
          contributorsLitecoin
            .map((c: { fieldData: { 'twitter-link': string } }) =>
              c.fieldData['twitter-link'].replace(
                /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//,
                ''
              )
            )
            .join(',') || '',
        advocates:
          advocates
            .map((c: { fieldData: { 'twitter-link': string } }) =>
              c.fieldData['twitter-link'].replace(
                /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//,
                ''
              )
            )
            .join(',') || '',
      } as ProjectItem,
      updates,
      faqs,
      posts,
    }
  })()

  if (!projectData) {
    notFound()
  }

  const { project, updates, faqs, posts } = projectData

  return (
    <ProjectClient
      project={project}
      updates={updates}
      faqs={faqs}
      posts={posts}
      slug={slug}
    />
  )
}

export default ProjectPage
