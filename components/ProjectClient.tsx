"use client"

import { useDonation } from '@/contexts/DonationContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
const PaymentModal = dynamic(() => import('@/components/PaymentModal'), {
  ssr: false,
})
import ThankYouModal from '@/components/ThankYouModal'
import { fetchGetJSON } from '@/utils/api-helpers'
import SEOHead from '@/components/SEOHead'
import ProjectHeader from '@/components/ProjectHeader'
import ProjectMenu from '@/components/ProjectMenu'
import MenuSections from '@/components/MenuSections'
import AsideSection from '@/components/AsideSection'
import React from 'react'
import {
  ProjectItem,
  AddressStats,
  BountyStatus,
  TwitterUser,
  ProjectUpdate,
} from '@/utils/types'

type ProjectClientProps = {
  project: ProjectItem
  updates: ProjectUpdate[]
  faqs: object[]
  posts: object[]
  slug: string
}

const ProjectClient: React.FC<ProjectClientProps> = ({
  project,
  updates,
  faqs,
  posts,
  slug,
}) => {
  const { dispatch } = useDonation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [modalOpen, setModalOpen] = useState(true) // Payment Modal
  const [isThankYouModalOpen, setThankYouModalOpen] = useState(false) // Thank you modal

  const [selectedProject, setSelectedProject] = useState<ProjectItem>()

  // Project Data
  const {
    // Main Info
    title,
    summary,
    coverImage,
    content,

    // Community Interaction
    contributor,
    contributorsBitcoin,
    contributorsLitecoin,
    advocates,
    hashtag,

    // Resources and Metadata
    website,

    // Links
    twitterHandle,
    gitRepository,
    discordLink,
    telegramLink,
    facebookLink,
    redditLink,

    // Funding
    bountyStatus,
    isRecurring,
    isBitcoinOlympics2024,
    serviceFeesCollected,
    isMatching,
    matchingMultiplier,
    recurringAmountGoal,
    totalPaid,
  } = project || {}

  // Log coverImage when it changes
  useEffect(() => {
    // console.log('Project cover image: ', coverImage)
  }, [coverImage])

  // State Variables
  const [addressStats, setAddressStats] = useState<AddressStats>()
  const [matchingDonors, setMatchingDonors] = useState(undefined)
  const [twitterUsers, setTwitterUsers] = useState<TwitterUser[]>([])
  const [matchingTotal, setMatchingTotal] = useState(0)
  const [twitterContributors, setTwitterContributors] = useState<TwitterUser[]>(
    []
  )
  const [twitterContributorsBitcoin, setTwitterContributorsBitcoin] = useState<
    TwitterUser[]
  >([])
  const [twitterContributorsLitecoin, setTwitterContributorsLitecoin] =
    useState<TwitterUser[]>([])
  const [twitterAdvocates, setTwitterAdvocates] = useState<TwitterUser[]>([])

  const [faq, setFaq] = useState<object>({})
  const [faqCount, setFaqCount] = useState<number>(0)

  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [monthlyDonorCount, setMonthlyDonorCount] = useState(0)
  const [timeLeftInMonth, setTimeLeftInMonth] = useState(0)

  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(
    'Info'
  )
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null)

  // Utility Functions
  const isValidUsernames = (usernames: string | undefined | null): boolean => {
    return typeof usernames === 'string' && usernames.trim().length > 0
  }

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
 
      return params.toString()
    },
    [searchParams]
  )
 
  function closeModal() {
    setModalOpen(false)
    setThankYouModalOpen(false)
    // Remove query parameters related to modal
    const params = new URLSearchParams(searchParams.toString())
    params.delete('modal')
    params.delete('thankyou')
    params.delete('name')
    router.push(`?${params.toString()}`)
  }

  function openPaymentModal() {
    setSelectedProject(project)
    setModalOpen(true)

    dispatch({
      type: 'SET_PROJECT_DETAILS',
      payload: {
        slug: project?.slug || '',
        title: project?.title || '',
        image: project?.coverImage || '',
      },
    })

    router.push(`?${createQueryString('modal', 'true')}`)
  }


  function extractUsername(url: string) {
    const regex = /\/([^/]+)$/
    const match = url.match(regex)
    return match ? match[1] : url
  }

  // Format function for USD
  function formatUSD(value: number | string | null | undefined) {
    const num = Number(value)

    if (isNaN(num) || value === '' || value === null) {
      return '0.00'
    }

    if (num === 0) {
      return '0.00'
    }

    // Format the number with two decimal places
    let [whole, fraction] = num.toFixed(1).split('.')
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    fraction = fraction + 0

    // Return formatted value with the fraction part
    return `${whole}.${fraction}`
  }

  // Format function for Lits
  function formatLits(value: number | string | null | undefined) {
    const num = Number(value)

    if (isNaN(num) || value === '' || value === null) {
      return '0'
    }

    if (num === 0) {
      return '0'
    }

    let [whole, fraction] = num.toFixed(8).split('.')
    whole += ''

    if (fraction && /^0+$/.test(fraction)) {
      return whole
    }

    if (fraction) {
      fraction =
        fraction.slice(0, 2) +
        ' ' +
        fraction.slice(2, 5) +
        ' ' +
        fraction.slice(5)
    }

    return fraction ? `${whole}.${fraction}` : whole
  }

  // Load FAQ data
  useEffect(() => {
    async function loadFAQData() {
      setFaqCount(faqs.length)
      setFaq(faqs)
    }

    loadFAQData()
  }, [faqs])

  // Fetch donations, contributors, and supporters
  useEffect(() => {
    const fetchData = async () => {
      setAddressStats(undefined)
      const stats = await fetchGetJSON(`/api/getInfoTGB?slug=${slug}`)
      setAddressStats(stats)

      const matchingDonors = await fetchGetJSON(
        `/api/matching-donors-by-project?slug=${slug}`
      )
      // console.log('matching donors', matchingDonors)

      setMatchingDonors(matchingDonors)

      // Matching goal calculation
      if (
        isMatching &&
        typeof matchingMultiplier === 'number' &&
        isBitcoinOlympics2024
      ) {
        const matchingTotalCalc =
          stats.funded_txo_sum * matchingMultiplier - stats.funded_txo_sum
        setMatchingTotal(matchingTotalCalc)
      }

      // Monthly goal calculation
      if (isRecurring && recurringAmountGoal) {
        const currentDate = new Date()
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        )
        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        )

        const monthlyDonations = stats.donatedCreatedTime.filter(
          (donation: { createdTime: number }) => {
            const donationDate = new Date(donation.createdTime * 1000)
            return donationDate >= startOfMonth && donationDate <= endOfMonth
          }
        )

        setMonthlyDonorCount(monthlyDonations.length)
        const monthlyTotalCalc = monthlyDonations.reduce(
          (total: number, donation: { amount: string }) =>
            total + Number(donation.amount),
          0
        )

        setMonthlyTotal(monthlyTotalCalc)

        const timeLeft = endOfMonth.getTime() - currentDate.getTime()
        const daysLeft = Math.ceil(timeLeft / (1000 * 3600 * 24))
        setTimeLeftInMonth(daysLeft)
      }

      const fetchTwitterUsers = async (usernames: string) => {
        const response = await fetch(`/api/twitterUsers?usernames=${usernames}`)
        return response.json()
      }

      if (isValidUsernames(contributor)) {
        const contributorsResponse = await fetchTwitterUsers(contributor!)
        setTwitterContributors(contributorsResponse)
      }

      if (isValidUsernames(contributorsBitcoin)) {
        const contributorsBitcoinResponse = await fetchTwitterUsers(
          contributorsBitcoin!
        )
        setTwitterContributorsBitcoin(contributorsBitcoinResponse)
      }

      if (isValidUsernames(contributorsLitecoin)) {
        const contributorsLitecoinResponse = await fetchTwitterUsers(
          contributorsLitecoin!
        )
        setTwitterContributorsLitecoin(contributorsLitecoinResponse)
      }

      if (isValidUsernames(advocates)) {
        const advocatesResponse = await fetchTwitterUsers(advocates!)
        setTwitterAdvocates(advocatesResponse)
      }

      if (stats.supporters && stats.supporters.length > 0) {
        const supporters = stats.supporters.map((supporter: string | object) => {
          if (typeof supporter === 'string' || supporter instanceof String) {
            return extractUsername(supporter.toString())
          } else {
            return 'anonymous'
          }
        })

        const uniqueSupporters = Array.from(new Set(supporters)).join(',')
        const twitterUsersResponse = await fetchTwitterUsers(uniqueSupporters)
        setTwitterUsers(twitterUsersResponse)
      }
    }

    fetchData().catch(console.error)
  }, [
    contributor,
    contributorsBitcoin,
    contributorsLitecoin,
    advocates,
    slug,
    isMatching,
    matchingMultiplier,
    isBitcoinOlympics2024,
    isRecurring,
    recurringAmountGoal,
  ])

  // Handle opening modals based on query parameters
  const openThankYouModalCallback = useCallback(() => {
    setSelectedProject(project)
    setThankYouModalOpen(true)
  }, [project])

  useEffect(() => {
    if (searchParams.get('thankyou') === 'true') {
      openThankYouModalCallback()
    }
  }, [searchParams, openThankYouModalCallback])

  useEffect(() => {
    if (searchParams.get('modal') === 'true') {
      setModalOpen(true)
    } else {
      setModalOpen(false)
    }
  }, [searchParams])

  // Handle selected menu item based on query parameters
  useEffect(() => {
    const menu = searchParams.get('menu')
    const updateId = searchParams.get('updateId')

    if (menu) {
      setSelectedMenuItem(menu)
    } else {
      setSelectedMenuItem('Info')
    }

    if (updateId) {
      setSelectedUpdateId(Number(updateId))
      if (menu !== 'updates') {
        setSelectedMenuItem('updates')
      }
    }
  }, [searchParams])

  // Scroll to selected update
  useEffect(() => {
    if (selectedUpdateId) {
      const element = document.getElementById(`update-${selectedUpdateId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [selectedUpdateId])

  // Global click handler to reset selectedUpdateId
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (updates) {
        let isOutside = true
        updates.forEach((post: ProjectUpdate) => {
          const element = document.getElementById(`update-${post.id}`)
          if (element && element.contains(event.target as Node)) {
            isOutside = false
          }
        })

        if (isOutside) {
          setSelectedUpdateId(null)
        }
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => {
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [updates])

  // Handle modal opening based on query parameters
  useEffect(() => {
    const modalParam = searchParams.get('modal')
    if (modalParam === 'true') {
      setModalOpen(true)

      // Set the selected project
      setSelectedProject(project)

      // Dispatch the project details to DonationContext
      dispatch({
        type: 'SET_PROJECT_DETAILS',
        payload: {
          slug: project?.slug || '',
          title: project?.title || '',
          image: project?.coverImage || '',
        },
      })
    } else {
      setModalOpen(false)
    }
  }, [searchParams, project, dispatch])

  // Handler for menu item changes
  const handleMenuItemChange = (
    newMenuItem: string,
    updateId: number | null = null
  ) => {
    setSelectedMenuItem(newMenuItem)

    const params = new URLSearchParams(searchParams.toString())
    params.set('menu', newMenuItem)
    if (updateId) {
      params.set('updateId', updateId.toString())
    } else {
      params.delete('updateId')
    }
    router.push(`/projects/${slug}?${params.toString()}`)
  }

  return (
    <>
      <SEOHead title={title || ''} summary={summary || ''} coverImage={coverImage || ''} />
      <div
        className="flex h-full w-screen max-w-none items-center bg-[#f2f2f2] bg-cover bg-center pb-8"
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        }}
      >
        <article className="relative mx-auto mt-32 flex min-h-screen w-[1300px] max-w-[90%] flex-col-reverse pb-16 lg:flex-row lg:items-start">
          <div className="content w-full leading-relaxed text-gray-800 lg:mr-5">
            {/* Project Header */}
            <ProjectHeader title={title || ''} summary={summary || ''} />

            {/* Project Menu */}
            <ProjectMenu
              onMenuItemChange={handleMenuItemChange}
              activeMenu={selectedMenuItem}
              commentCount={posts.length || 0}
              faqCount={faqCount || 0}
              updatesCount={(updates && updates.length) || 0}
            />

            {/* Menu Sections */}
            <MenuSections
              selectedMenuItem={selectedMenuItem || 'Info'}
              title={title || ''}
              content={content || ''}
              socialSummary={project.socialSummary || ''}
              faq={faq}
              faqCount={faqCount}
              updates={updates || []}
              selectedUpdateId={selectedUpdateId}
              setSelectedUpdateId={setSelectedUpdateId}
              hashtag={hashtag || ''}
              tweetsData={posts} // WIP
              twitterContributors={twitterContributors}
              twitterContributorsBitcoin={twitterContributorsBitcoin}
              twitterContributorsLitecoin={twitterContributorsLitecoin}
              twitterAdvocates={twitterAdvocates}
              twitterUsers={twitterUsers} // donors
              isBitcoinOlympics2024={isBitcoinOlympics2024 || false}
              formatLits={formatLits}
              formatUSD={formatUSD}
              website={website || ''}
              gitRepository={gitRepository || ''}
              twitterHandle={twitterHandle || ''}
              discordLink={discordLink || ''}
              telegramLink={telegramLink || ''}
              facebookLink={facebookLink || ''}
              redditLink={redditLink || ''}
            />
          </div>

          {/* Aside Section */}
          <AsideSection
            title={title || ''}
            coverImage={coverImage || ''}
            addressStats={addressStats as AddressStats}
            isMatching={isMatching || true}
            isBitcoinOlympics2024={isBitcoinOlympics2024 || false}
            isRecurring={isRecurring || false}
            matchingDonors={matchingDonors}
            matchingTotal={matchingTotal}
            serviceFeeCollected={serviceFeesCollected}
            totalPaid={totalPaid || undefined}
            // formatLits={formatLits}
            formatUSD={formatUSD}
            monthlyTotal={monthlyTotal}
            recurringAmountGoal={recurringAmountGoal}
            monthlyDonorCount={monthlyDonorCount}
            timeLeftInMonth={timeLeftInMonth}
            bountyStatus={bountyStatus as BountyStatus}
            openPaymentModal={openPaymentModal}
          />
        </article>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        project={selectedProject}
      />
      <ThankYouModal
        isOpen={isThankYouModalOpen}
        onRequestClose={closeModal}
        project={selectedProject}
      />
    </>
  )
}

export default ProjectClient
