import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function analytics(_: NextApiRequest, res: NextApiResponse) {
  res.redirect(process.env.GOOGLE_ANALYTICS_DASHBOARD_URL ?? '')
}

export default withAdminUserRoute(analytics)
