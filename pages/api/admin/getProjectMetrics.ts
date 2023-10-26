import { getMetricsForProject } from '@/src/server/datastore/projects'
import { withAdminUserRoute } from '@/src/server/session'
import { ProjectMetrics } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getProjectMetrics(req: NextApiRequest, res: NextApiResponse<ProjectMetrics>) {
  const before = req.body.before ? new Date(req.body.before) : undefined
  const projectMetrics = await getMetricsForProject(req.body.projectID, req.body.workspaceID, before)
  res.json(projectMetrics)
}

export default withAdminUserRoute(getProjectMetrics)
