import type { NextApiRequest, NextApiResponse } from 'next'
import { withCronRoute } from '@/src/server/session'
import { getLastProcessedCommentDate, saveLastProcessedCommentDate } from '@/src/server/datastore/environment'
import { getRecentComments } from '@/src/server/datastore/comments'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = new Date()
  const lastProcessedCommentDate = await getLastProcessedCommentDate()
  if (!lastProcessedCommentDate) {
    await saveLastProcessedCommentDate(now)
    return res.status(200).json({})
  }

  const limit = Number(req.query.limit ?? '100')
  const buffer = Number(req.query.buffer ?? '300')
  const cutoffDate = new Date(now.getTime() - buffer * 1000)

  const recentComments = await getRecentComments(lastProcessedCommentDate, cutoffDate, limit, true)

  if (recentComments.length > 0) {
    await saveLastProcessedCommentDate(new Date(recentComments[0].timestamp))
  }

  res.status(200).json({})
}

export default withCronRoute(handler)
