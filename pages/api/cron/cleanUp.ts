import type { NextApiRequest, NextApiResponse } from 'next'
import { withCronRoute } from '@/src/server/session'
import cleanUpEntities from '@/src/server/datastore/cleanup'

async function cleanUp(_: NextApiRequest, res: NextApiResponse) {
  await cleanUpEntities()
  res.status(200).json({})
}

export default withCronRoute(cleanUp)
