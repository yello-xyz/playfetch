import type { NextApiRequest, NextApiResponse } from 'next'
import { withAdminUserRoute, withCronRoute } from '@/src/server/session'
import { getLastProcessedCommentDate, saveLastProcessedCommentDate } from '@/src/server/datastore/environment'
import { getEarlierCommentsForVersion, getRecentComments } from '@/src/server/datastore/comments'
import { Entity, getID, getKeyedEntities } from '@/src/server/datastore/datastore'
import { Comment, RawChainVersion, RawPromptVersion } from '@/types'
import { toVersionWithComments } from '@/src/server/datastore/versions'
import { toUser } from '@/src/server/datastore/users'

const EarlierCommentsToFetchForVersion = 10

const IsReplyToComment = (comment: Comment) => (candidate: Comment) => 
  candidate.versionID === comment.versionID &&
  candidate.timestamp < comment.timestamp &&
  candidate.userID !== comment.userID &&
  candidate.runID === comment.runID &&
  candidate.itemIndex === comment.itemIndex &&
  candidate.startIndex === comment.startIndex &&
  candidate.quote === comment.quote &&
  ((!comment.action && !candidate.action) ||
    (comment.action && candidate.action && candidate.action !== comment.action && candidate.text === comment.text))

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

  const earliestCommentDate = new Date(recentComments.slice(-1)[0]?.timestamp ?? 0)
  const commenterIDs = [...new Set(recentComments.map(comment => comment.userID))]
  const versionIDs = [...new Set(recentComments.map(comment => comment.versionID))]

  const versionsData = await getKeyedEntities(Entity.VERSION, versionIDs)
  const versions: (RawPromptVersion | RawChainVersion)[] = []
  for (const versionData of versionsData) {
    const earlierComments = await getEarlierCommentsForVersion(
      getID(versionData),
      earliestCommentDate,
      EarlierCommentsToFetchForVersion
    )
    versions.push(toVersionWithComments(versionData, [...recentComments, ...earlierComments]))
  }

  const targetToComments: { [userID: number]: Comment[] } = {}
  for (const comment of recentComments.slice().reverse()) {
    const version = versions.find(version => version.id === comment.versionID)
    if (version) {
      const targetUserID = version.comments.find(IsReplyToComment(comment))?.userID ?? version.userID
      if (targetUserID !== comment.userID) {
        targetToComments[targetUserID] = [...(targetToComments[targetUserID] ?? []), comment]
      }
    }
  }

  const usersData = await getKeyedEntities(Entity.USER, [...commenterIDs, ...Object.keys(targetToComments).map(Number)])
  const users = usersData.map(toUser)

  for (const [targetUserID, commentsForTarget] of Object.entries(targetToComments)) {
    const targetUser = users.find(user => user.id === Number(targetUserID))
    for (const comment of commentsForTarget) {
      const commenter = users.find(user => user.id === comment.userID)
      console.log(
        `Sending notification to ${targetUser?.email} about comment from ${commenter?.email} on ${comment.versionID}`
      )
    }
  }

  if (recentComments.length > 0) {
    // await saveLastProcessedCommentDate(new Date(recentComments[0].timestamp))
  }

  res.status(200).json({})
}

export default withAdminUserRoute(handler)
