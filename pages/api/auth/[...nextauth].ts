import { CheckValidEmail } from '@/src/common/formatting'
import NextAuthAdapter from '@/src/server/datastore/nextAuthAdapter'
import { getUserForEmail, markUserLogin, saveUser } from '@/src/server/datastore/users'
import { GetNoReplyFromAddress } from '@/src/server/email'
import NextAuth, { Session, SessionStrategy, User } from 'next-auth'
import { JWT } from 'next-auth/jwt/types'
import EmailProvider from 'next-auth/providers/email'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'

const getRegisteredUser = async (email?: string | null) => (email ? getUserForEmail(email) : undefined)

export const authOptions = {
  adapter: NextAuthAdapter(),
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: process.env.NOREPLY_EMAIL_USER,
          pass: process.env.NOREPLY_EMAIL_PASSWORD,
        },
      },
      from: GetNoReplyFromAddress(),
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
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
      } else if (CheckValidEmail(user.email ?? '')) {
        await saveUser(user.email ?? '', user.name ?? '')
        return false // TODO redirect to show waitlist confirmation
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
          token.imageURL = registeredUser.imageURL
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
        imageURL: token.imageURL as string,
        isAdmin: token.isAdmin as boolean,
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
