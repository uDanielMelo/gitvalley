import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:follow public_repo',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'github') return false

      const p = profile as any

      await prisma.user.upsert({
        where: { githubId: p.id },
        update: {
          username: p.login,
          name: p.name,
          avatarUrl: p.avatar_url,
        },
        create: {
          githubId: p.id,
          username: p.login,
          name: p.name,
          avatarUrl: p.avatar_url,
        },
      })

      return true
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const p = profile as any
        token.githubId = p.id
        token.username = p.login
        token.accessToken = account.access_token

        // Busca o id interno do banco
        const user = await prisma.user.findUnique({
          where: { githubId: p.id },
        })
        if (user) token.internalId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.internalId as string
      session.user.username = token.username as string
      session.accessToken = token.accessToken as string
      return session
    },
  },
})