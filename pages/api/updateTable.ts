import { updateTableForChain } from '@/src/server/datastore/chains'
import { updateTableForPrompt } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateTable(req: NextApiRequest, res: NextApiResponse<number | null>, user: User) {
  const tableID = req.body.chainID
    ? await updateTableForChain(user.id, req.body.chainID, req.body.tableID)
    : await updateTableForPrompt(user.id, req.body.promptID, req.body.tableID)

  res.json(tableID)
}

export default withLoggedInUserRoute(updateTable)
