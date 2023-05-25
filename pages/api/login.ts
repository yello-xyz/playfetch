import ClientRoute from '@/client/clientRoute'
import { getUserForEmail } from '@/server/datastore'
import { sendMail } from '@/server/email'
import { buildURLForClientRoute } from '@/server/routing'
import { withSessionRoute } from '@/server/session'
import { sealData } from 'iron-session'
import { NextApiRequest, NextApiResponse } from 'next'

async function login(req: NextApiRequest, res: NextApiResponse<string>) {
  const user = await getUserForEmail(req.body.email)
  if (user) {
    const { id, email } = user
    const seal = await sealData({ id }, { password: process.env.TOKEN_SECRET ?? '', ttl: 15 * 60 })
    const token = Buffer.from(seal).toString('base64')
    const url = buildURLForClientRoute(`${ClientRoute.Login}/${token}`, req.headers)
    await sendMail(email, 'Log in to PlayFetch', `Log in: ${url}`, `<a href="${url}">Log in</a>`)
    return res.json('Please check your email for a login link.')
  } else {
    return res.json('We could not find a user with that email address.')
  }
}

export default withSessionRoute(login)
