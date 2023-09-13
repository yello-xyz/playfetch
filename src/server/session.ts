import ClientRoute, { Redirect } from '@/src/client/clientRoute'
import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiHandler,
  NextApiRequest,
  NextApiResponse,
} from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { User } from '@/types'

export function withErrorRoute(handler: NextApiHandler): NextApiHandler {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    try {
      return await handler(req, res)
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }
}

type LoggedInAPIHandler = (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void> | void

export function withLoggedInUserRoute(handler: LoggedInAPIHandler): NextApiHandler {
  return withErrorRoute(async (req, res) => {
    const session = await getServerSession(req, res, authOptions(req, res))
    if (session?.user?.id) {
      return handler(req, res, session.user)
    } else {
      return res.status(401).json(null)
    }
  })
}

export function withAdminUserRoute(handler: LoggedInAPIHandler): NextApiHandler {
  return withLoggedInUserRoute(async (req, res, user) => {
    if (user.isAdmin) {
      return handler(req, res, user)
    } else {
      return res.status(401).json(null)
    }
  })
}

type UnknownRecord = Record<string, unknown>
type GetServerSidePropsContextWithUser = GetServerSidePropsContext & { user: User }
type ServerSideHandler = (
  context: GetServerSidePropsContext
) => GetServerSidePropsResult<UnknownRecord> | Promise<GetServerSidePropsResult<UnknownRecord>>

function withServerSideError(handler: ServerSideHandler): ServerSideHandler {
  return async function (context: GetServerSidePropsContext) {
    try {
      return await handler(context)
    } catch (error) {
      console.error(error)
      return {} as GetServerSidePropsResult<UnknownRecord>
    }
  }
}

type LoggedInServerSideHandler = (
  context: GetServerSidePropsContextWithUser
) => GetServerSidePropsResult<UnknownRecord> | Promise<GetServerSidePropsResult<UnknownRecord>>

export function withLoggedInSession(handler: LoggedInServerSideHandler): ServerSideHandler {
  return withServerSideError(async context => {
    const session = await getServerSession(context.req, context.res, authOptions(context.req, context.res))
    if (session?.user?.id) {
      return handler({ ...context, user: session.user })
    } else {
      return Redirect(ClientRoute.Login)
    }
  })
}

export function withAdminSession(handler: LoggedInServerSideHandler) {
  return withLoggedInSession(async context => {
    if (context.user.isAdmin) {
      return handler(context)
    } else {
      return Redirect(ClientRoute.Home)
    }
  })
}

export function withLoggedOutSession(handler: ServerSideHandler): ServerSideHandler {
  return withServerSideError(async context => {
    const session = await getServerSession(context.req, context.res, authOptions(context.req, context.res))
    if (session?.user?.id) {
      return Redirect(ClientRoute.Home)
    } else {
      return handler(context)
    }
  })
}
