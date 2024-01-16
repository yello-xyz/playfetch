import { LayoutConfig } from '@/src/common/userPresets'
import { saveLayoutConfigForUser } from '@/src/server/datastore/users'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateLayoutConfig(req: NextApiRequest, res: NextApiResponse<LayoutConfig>, user: User) {
  const layoutConfig = await saveLayoutConfigForUser(user.id, req.body.layoutConfig)
  res.json(layoutConfig)
}

export default withLoggedInUserRoute(updateLayoutConfig)
