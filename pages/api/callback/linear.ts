import { UserSettingsRoute } from '@/src/common/clientRoute'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import { LinearRedirectURI, validateStateForUser } from '../authorizeLinear'
import { LinearClient } from '@linear/sdk'
import { saveProviderKey } from '@/src/server/datastore/providers'

async function linear(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { code, state } = req.query

  if (validateStateForUser(user, state as string)) {
    const query = new URLSearchParams()
    query.set('client_id', process.env.LINEAR_APP_CLIENT_ID ?? '')
    query.set('client_secret', process.env.LINEAR_APP_CLIENT_SECRET ?? '')
    query.set('redirect_uri', LinearRedirectURI)
    query.set('code', code as string)
    query.set('grant_type', 'authorization_code')

    const response = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: query.toString(),
    }).then(response => response.json())

    const accessToken = response.access_token
    if (accessToken) {
      const client = new LinearClient({ accessToken })
      const viewer = await client.viewer
      await saveProviderKey(user.id, user.id, 'linear', accessToken, viewer.id)
    }
  }

  res.redirect(UserSettingsRoute('issueTracker'))
}

export default withLoggedInUserRoute(linear)
