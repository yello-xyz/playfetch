import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function loadURL(req: NextApiRequest, res: NextApiResponse) {
  const dashboardType = req.query.type
  switch (dashboardType) {
    case 'analyticsDashboard':
      res.redirect(process.env.GOOGLE_ANALYTICS_DASHBOARD_URL ?? '')
      break
    case 'serverLogs':
      res.redirect(process.env.SERVER_LOGS_URL ?? '')
      break
    default:
      res.status(400).json({ error: 'Invalid type' })
      break
  }
}

export default withAdminUserRoute(loadURL)
