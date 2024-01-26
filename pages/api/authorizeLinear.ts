import { decrypt, encrypt } from '@/src/server/datastore/datastore'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

const getStateForUser = (user: User) =>
  encrypt(JSON.stringify({ userID: user.id, expiresAt: Date.now() + 10 * 60 * 1000 }))

export const validateStateForUser = (user: User, state: string) => {
  const { userID, expiresAt } = JSON.parse(decrypt(state))
  return user.id === userID && expiresAt > Date.now()
}

export const LinearRedirectURI = `${process.env.NEXTAUTH_URL}/api/callback/linear`

async function authorizeLinear(_: NextApiRequest, res: NextApiResponse<string>, user: User) {
  const query = new URLSearchParams()
  query.set('client_id', process.env.LINEAR_APP_CLIENT_ID ?? '')
  query.set('redirect_uri', LinearRedirectURI)
  query.set('response_type', 'code')
  query.set('scope', 'read,issues:create')
  query.set('state', getStateForUser(user))
  query.set('prompt', 'consent')

  res.json(`https://linear.app/oauth/authorize?${query.toString()}`)
}

export default withLoggedInUserRoute(authorizeLinear)
