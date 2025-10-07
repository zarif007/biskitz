import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import type { NextAuthConfig } from 'next-auth'

export default {
  providers: [GitHub, Google],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true
    },
  },
} satisfies NextAuthConfig
