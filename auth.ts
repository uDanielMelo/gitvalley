import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

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
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const p = profile as any
        token.githubId = p.id
        token.username = p.login
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = String(token.githubId)
      session.user.username = token.username as string
      return session
    },
  },
})