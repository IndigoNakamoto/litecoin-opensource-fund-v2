'use client'

import { SessionProvider } from 'next-auth/react'
import { DonationProvider } from '@/contexts/DonationContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DonationProvider>
        {children}
      </DonationProvider>
    </SessionProvider>
  )
}
