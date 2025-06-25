import NextAuth from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { Session } from 'next-auth'

// Extend the Session type to include the username property
interface CustomSession extends Session {
  user: {
    name: string
    email: string
    image: string
    username: string
    id: string
  }
}

interface CustomProfile {
  data: {
    id: string
    name: string
    username: string
    profile_image_url: string
  }
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      version: '2.0', // opt-in to Twitter OAuth 2.0
      profile(profile) {
        const { id, name, username, profile_image_url: image } = profile.data
        return {
          id,
          name,
          username,
          image,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, profile }) => {
      try {
        if (profile) {
          const customProfile = profile as CustomProfile // Cast to CustomProfile
          token.username = customProfile.data.username
        }
        return token
      } catch (error) {
        console.error('Error in JWT callback:', error)
        throw new Error('Failed to process JWT token.')
      }
    },
    session: async ({ session, token }) => {
      try {
        const customSession = session as CustomSession
        customSession.user.username = token.username as string // Cast to string to satisfy TypeScript
        return customSession
      } catch (error) {
        console.error('Error in session callback:', error)
        throw new Error('Failed to update user session.')
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})
