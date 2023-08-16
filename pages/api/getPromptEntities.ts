import { getPromptInputValuesForUser } from '@/src/server/datastore/inputs';
import { getPromptVersionsForUser } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { Version, User, InputValues } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPromptEntities(
  req: NextApiRequest,
  res: NextApiResponse<{ versions: Version[]; inputValues: InputValues }>,
  user: User
) {
  const versions = await getPromptVersionsForUser(user.id, req.body.promptID)
  const inputValues = await getPromptInputValuesForUser(user.id, req.body.promptID)
  res.json({ versions, inputValues })
}

export default withLoggedInUserRoute(getPromptEntities)
