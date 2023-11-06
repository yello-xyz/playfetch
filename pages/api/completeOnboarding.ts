import { markUserAsOnboarded } from '@/src/server/datastore/users'
import { addOnboardingResponse } from '@/src/server/notion'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function completeOnboarding(req: NextApiRequest, res: NextApiResponse, user: User) {
  await addOnboardingResponse(user.email, user.fullName, req.body.response)
  await markUserAsOnboarded(user.id)
  res.json({})
}

export default withLoggedInUserRoute(completeOnboarding)
