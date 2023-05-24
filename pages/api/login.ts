import { withSessionRoute } from '@/server/session'
import { NextApiRequest, NextApiResponse } from 'next'

async function login(req: NextApiRequest, res: NextApiResponse) {
  req.session.user = {
    email: req.body.email,
    isAdmin: true,
  }
  await req.session.save()
  res.json({})
}

export default withSessionRoute(login)
