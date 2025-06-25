"use client"
// components/SocialMediaShare.js
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import SocialIcon from './social-icons'
import Notification from './Notification'

const SocialMediaShare = ({ summary }: { summary: string }) => {
  const pathname = usePathname()
  const currentURL = `https://litecoin.com` + pathname
  const encodedText = encodeURIComponent(summary)

  const [notification, setNotification] = useState('')

  // Function to copy text to clipboard and show notification
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotification('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
      setNotification('Failed to copy the link. Please try again.')
    }
  }

  const shareLinks = [
    {
      kind: 'link',
      url: currentURL,
      action: () => copyToClipboard(currentURL), // Copy to clipboard and notify user
    },
    {
      kind: 'x',
      url: `https://twitter.com/intent/tweet?text=${encodedText}%0A%0A&url=${currentURL}%0A%0A&via=LTCFoundation`,
    },
    {
      kind: 'facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${currentURL}`,
    },
  ]

  return (
    <div className="markdown pb-6 pl-6">
      <h3>Share:</h3>
      {shareLinks.map((link) => (
        <SocialIcon
          key={link.kind}
          kind={link.kind}
          href={link.url}
          size={5}
          onClick={
            link.action
              ? (e) => {
                  e.preventDefault()
                  link.action()
                }
              : undefined
          }
        />
      ))}
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification('')}
        />
      )}
    </div>
  )
}

export default SocialMediaShare
