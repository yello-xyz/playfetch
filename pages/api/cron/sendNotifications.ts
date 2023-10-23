import type { NextApiRequest, NextApiResponse } from 'next'
import { withAdminUserRoute, withCronRoute } from '@/src/server/session'
import { getLastProcessedCommentDate, saveLastProcessedCommentDate } from '@/src/server/datastore/environment'
import { getRecentComments } from '@/src/server/datastore/comments'
import { Entity, getID, getKeyedEntities } from '@/src/server/datastore/datastore'
import { Comment } from '@/types'
import { toUser } from '@/src/server/datastore/users'

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
  const replyToCommentIDs = [...new Set(recentComments.map(comment => comment.replyTo ?? 0))]
  const replyToCommentsData = await getKeyedEntities(Entity.COMMENT, replyToCommentIDs.filter(id => id))

  const versionIDs = [...new Set(recentComments.map(comment => comment.versionID))]
  const versionsData = await getKeyedEntities(Entity.VERSION, versionIDs)

  const targetToComments: { [userID: number]: Comment[] } = {}
  for (const comment of recentComments.slice().reverse()) {
    const version = versionsData.find(data => getID(data) === comment.versionID)
    const replyToComment = replyToCommentsData.find(data => getID(data) === comment.replyTo)
    const targetUserID = replyToComment?.userID ?? version?.userID
    if (targetUserID && targetUserID !== comment.userID) {
      targetToComments[targetUserID] = [...(targetToComments[targetUserID] ?? []), comment]
    }
  }

  const commenterIDs = [...new Set(recentComments.map(comment => comment.userID))]
  const usersData = await getKeyedEntities(Entity.USER, [...commenterIDs, ...Object.keys(targetToComments).map(Number)])
  const users = usersData.map(toUser)

  const promptIDs = versionsData.filter(data => !!data.prompts).map(data => data.parentID)
  const promptsData = await getKeyedEntities(Entity.PROMPT, promptIDs)
  const chainIDs = versionsData.filter(data => !!data.items).map(data => data.parentID)
  const chainsData = await getKeyedEntities(Entity.CHAIN, chainIDs)

  for (const [targetUserID, commentsForTarget] of Object.entries(targetToComments)) {
    const targetUser = users.find(user => user.id === Number(targetUserID))
    for (const comment of commentsForTarget) {
      const commenter = users.find(user => user.id === comment.userID)
      const version = versionsData.find(data => getID(data) === comment.versionID)
      const chain = chainsData.find(data => getID(data) === version.parentID)
      const prompt = promptsData.find(data => getID(data) === version.parentID)
      console.log(
        `Sending notification to ${targetUser?.email} about comment from ${commenter?.email} on ${chain ? 'chain' : 'prompt'} ${chain ? chain.name : prompt?.name}`
      )
    }
  }

  if (recentComments.length > 0) {
    // await saveLastProcessedCommentDate(new Date(recentComments[0].timestamp))
  }

  res.status(200).json({})
}

export default withAdminUserRoute(handler)
