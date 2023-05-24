import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next'
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from 'next'

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      email: string
      admin?: boolean
    }
  }
}

export const sessionOptions = {
  cookieName: 'playfetch',
  password: process.env.SESSION_SECRET ?? '',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export function withSessionHandler(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions)
}

export function withSession<P extends { [key: string]: unknown } = { [key: string]: unknown }>(
  handler: (context: GetServerSidePropsContext) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return withIronSessionSsr(handler, sessionOptions)
}
