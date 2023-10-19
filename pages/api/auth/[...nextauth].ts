import ClientRoute from '@/src/client/clientRoute'
import { CheckValidEmail } from '@/src/common/formatting'
import logUserRequest, { LoginEvent, SignupEvent, logUnknownUserRequest } from '@/src/server/analytics'
import NextAuthAdapter from '@/src/server/datastore/nextAuthAdapter'
import { getUserForEmail, markUserLogin } from '@/src/server/datastore/users'
import { GetEmailServerConfig, GetNoReplyFromAddress } from '@/src/server/email'
import signUpNewUser from '@/src/server/waitlist'
import { ServerResponse } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import NextAuth, { Session, SessionStrategy, User } from 'next-auth'
import { JWT } from 'next-auth/jwt/types'
import EmailProvider from 'next-auth/providers/email'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { NextApiRequestCookies } from 'next/dist/server/api-utils'

const getRegisteredUser = async (email?: string | null) => (email ? getUserForEmail(email) : undefined)

export const authOptions = (req: { cookies: NextApiRequestCookies }, res: ServerResponse) => ({
  adapter: NextAuthAdapter(),
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  providers: [
    EmailProvider({
      server: GetEmailServerConfig(),
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
    async signIn({
      user,
      account,
      email,
    }: {
      user: User
      account: { provider: string } | null
      email?: { verificationRequest?: boolean }
    }) {
      const registeredUser = await getRegisteredUser(user.email)
      if (registeredUser) {
        if (!email?.verificationRequest) {
          logUserRequest(req, res, registeredUser.id, LoginEvent(account?.provider))
          await markUserLogin(registeredUser.id, user.name ?? '', user.image ?? '')
        }
        return true
      } else if (CheckValidEmail(user.email ?? '')) {
        // TODO should we postpone this until the email is verified and return true above otherwise?
        signUpNewUser(user.email ?? '', user.name ?? '')
        logUnknownUserRequest(req, res, SignupEvent(account?.provider))
        return ClientRoute.Waitlist
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
})

const getNextAuthOptions = (req: NextApiRequest, res: NextApiResponse) => NextAuth(req, res, authOptions(req, res))

export default getNextAuthOptions
