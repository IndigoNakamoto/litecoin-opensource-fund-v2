// import { Inter } from 'next/font/google'
import SectionContainer from '@/components/SectionContainer'
import Footer from '@/components/Footer'
import { ReactNode } from 'react'
// import Header from './Header'
import Navigation from '@/components/Navigation'

interface Props {
  children: ReactNode
}

// const inter = Inter({
//   subsets: ['latin'],
// })

const LayoutWrapper = ({ children }: Props) => {
  return (
    <SectionContainer>
      <div
        className={`flex h-screen flex-col justify-between font-sans`} //${inter.className}
      >
        {/* <Header /> */}
        <Navigation />
        <main className="mb-auto">{children}</main>
        <Footer />
      </div>
    </SectionContainer>
  )
}

export default LayoutWrapper
