import { withSessionHandler } from '@/server/session'
import { NextApiRequest, NextApiResponse } from 'next'

async function login(req: NextApiRequest, res: NextApiResponse) {
  req.session.user = {
    id: 230,
    admin: true,
  }
  await req.session.save()
  res.json({})
}

export default withSessionHandler(login)
