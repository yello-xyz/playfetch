import { UserSettingsRoute } from '@/src/common/clientRoute'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import { LinearRedirectURI, validateStateForUser } from '../authorizeLinear'
import { LinearClient } from '@linear/sdk'

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
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: query.toString(),
    }).then(response => response.json())

    console.log(response)

    const client = new LinearClient({ accessToken: response.access_token })
    const me = await client.viewer
    console.log(me)
  }

  res.redirect(UserSettingsRoute('sourceControl'))
}

export default withLoggedInUserRoute(linear)
