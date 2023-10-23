import { getMetricsForWorkspace } from '@/src/server/datastore/workspaces'
import { withAdminUserRoute } from '@/src/server/session'
import { WorkspaceMetrics } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getWorkspaceMetrics(req: NextApiRequest, res: NextApiResponse<WorkspaceMetrics>) {
  const workspace = await getMetricsForWorkspace(req.body.workspaceID)
  res.json(workspace)
}

export default withAdminUserRoute(getWorkspaceMetrics)
