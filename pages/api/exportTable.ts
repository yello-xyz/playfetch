import { exportChainInputs } from '@/src/server/datastore/chains'
import { exportPromptInputs } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function exportTable(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const tableID = req.body.chainID
    ? await exportChainInputs(user.id, req.body.chainID)
    : await exportPromptInputs(user.id, req.body.promptID)

  res.json(tableID)
}

export default withLoggedInUserRoute(exportTable)
