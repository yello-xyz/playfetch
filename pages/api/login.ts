import { getUser } from '@/server/datastore'
import { withSessionRoute } from '@/server/session'
import { NextApiRequest, NextApiResponse } from 'next'

async function login(req: NextApiRequest, res: NextApiResponse) {
  req.session.user = await getUser(req.body.email)
  await req.session.save()
  res.json({})
}

export default withSessionRoute(login)
