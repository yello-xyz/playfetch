import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function analytics(_: NextApiRequest, res: NextApiResponse) {
  res.redirect(process.env.SERVER_LOGS_URL ?? '')
}

export default withAdminUserRoute(analytics)
