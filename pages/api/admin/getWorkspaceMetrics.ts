import { getMetricsForWorkspace } from '@/src/server/datastore/workspaces'
import { withAdminUserRoute } from '@/src/server/session'
import { WorkspaceMetrics } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getWorkspaceMetrics(req: NextApiRequest, res: NextApiResponse<WorkspaceMetrics>) {
  const before = req.body.before ? new Date(req.body.before) : undefined
  const workspace = await getMetricsForWorkspace(req.body.workspaceID, before)
  res.json(workspace)
}

export default withAdminUserRoute(getWorkspaceMetrics)
