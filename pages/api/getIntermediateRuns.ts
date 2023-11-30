import { getIntermediateRunsForParentRun } from '@/src/server/datastore/runs'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User, Run } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getIntermediateRuns(req: NextApiRequest, res: NextApiResponse<Run[]>, user: User) {
  const runs = await getIntermediateRunsForParentRun(user.id, req.body.parentRunID, req.body.continuationID)
  res.json(runs)
}

export default withLoggedInUserRoute(getIntermediateRuns)
