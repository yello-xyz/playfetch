import { getUserForEmail, markUserLogin } from '@/server/datastore/users'
import NextAuth, { Session, User } from 'next-auth'
import { JWT } from 'next-auth/jwt/types'
import GithubProvider from 'next-auth/providers/github'

const getRegisteredUser = async (email?: string | null) => email ? getUserForEmail(email) : undefined

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: User }) {
      const registeredUser = await getRegisteredUser(user.email)
      if (registeredUser) {
        await markUserLogin(registeredUser.id, user.name ?? '', user.image ?? '')
        return true
      } else {
        return false
      }
    },
    async jwt({ token, user }: { user: User; token: JWT }) {
      if (user) {
        const registeredUser = await getRegisteredUser(user.email)
        if (registeredUser) {
          token.id = registeredUser.id
          token.fullName = registeredUser.fullName
          token.avatarColor = registeredUser.avatarColor
          token.isAdmin = registeredUser.isAdmin
        }
      }
      return token
    },
    async session({ token, session }: { token: JWT; session: Session }) {
      session.user = {
        id: token.id as number,
        email: token.email as string,
        fullName: token.fullName as string,
        avatarColor: token.avatarColor as string,
        isAdmin: token.isAdmin as boolean,
      }
      return session
    },      
  },
}

export default NextAuth(authOptions)
