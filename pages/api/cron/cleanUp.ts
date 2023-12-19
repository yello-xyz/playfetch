import type { NextApiRequest, NextApiResponse } from 'next'
import { withAdminUserRoute, withCronRoute } from '@/src/server/session'
import cleanUpEntities from '@/src/server/datastore/cleanup'

async function cleanUp(_: NextApiRequest, res: NextApiResponse) {
  await cleanUpEntities()
  res.status(200).json({})
}

export default withAdminUserRoute(cleanUp)
// export default withCronRoute(cleanup)
