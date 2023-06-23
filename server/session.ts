import ClientRoute, { Redirect } from '@/client/clientRoute'
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next'
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from 'next'

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: number
      email: string
      fullName: string
      avatarColor: string
      isAdmin: boolean
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

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions)
}

export function withLoggedInSessionRoute(handler: NextApiHandler) {
  return withSessionRoute(async (req, res) => {
    if (req.session.user) {
      return handler(req, res)
    } else {
      return res.status(401).json(null)
    }
  })
}

export function withAdminRoute(handler: NextApiHandler) {
  return withSessionRoute(async (req, res) => {
    if (req.session.user?.isAdmin) {
      return handler(req, res)
    } else {
      return res.status(401).json(null)
    }
  })
}

type UnknownRecord = Record<string, unknown>
type ServerSideHandler<P extends UnknownRecord = UnknownRecord> = (
  context: GetServerSidePropsContext
) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>

export function withSession<P extends UnknownRecord = UnknownRecord>(handler: ServerSideHandler<P>) {
  return withIronSessionSsr(handler, sessionOptions)
}

export function withLoggedInSession<P extends UnknownRecord = UnknownRecord>(handler: ServerSideHandler<P>) {
  return withSession(async context => {
    if (context.req.session.user) {
      return handler(context)
    } else {
      return Redirect(ClientRoute.Login)
    }
  })
}

export function withAdminSession<P extends UnknownRecord = UnknownRecord>(handler: ServerSideHandler<P>) {
  return withSession(async context => {
    if (context.req.session.user?.isAdmin) {
      return handler(context)
    } else {
      return Redirect(ClientRoute.Home)
    }
  })
}

export function withLoggedOutSession<P extends UnknownRecord = UnknownRecord>(handler: ServerSideHandler<P>) {
  return withSession(async context => {
    if (context.req.session.user) {
      return Redirect(ClientRoute.Home)
    } else {
      return handler(context)
    }
  })
}
