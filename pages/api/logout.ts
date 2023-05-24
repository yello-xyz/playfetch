import { withSession } from '@/server/session'
import { NextApiRequest, NextApiResponse } from 'next'

async function logout(req: NextApiRequest, res: NextApiResponse) {
  req.session.destroy()
  res.json({})
}

export default withSession(logout)
