import { withSession } from '@/server/session'
import { NextApiRequest, NextApiResponse } from 'next'

async function login(req: NextApiRequest, res: NextApiResponse) {
  req.session.user = {
    email: req.body.email,
    admin: true,
  }
  await req.session.save()
  res.json({})
}

export default withSession(login)
