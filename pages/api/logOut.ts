import NextAuthAdapter from '@/src/server/datastore/nextAuthAdapter'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function logOut(_: NextApiRequest, res: NextApiResponse, user: User) {
  const nextAuthAdapter = NextAuthAdapter()
  const nextAuthUser = await nextAuthAdapter.getUserByEmail?.(user.email)
  if (nextAuthUser) {
    await nextAuthAdapter.deleteUser?.(nextAuthUser.id)
  }
  res.json({})
}

export default withLoggedInUserRoute(logOut)
