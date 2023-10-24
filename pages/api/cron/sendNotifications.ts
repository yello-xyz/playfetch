import type { NextApiRequest, NextApiResponse } from 'next'
import { withAdminUserRoute, withCronRoute } from '@/src/server/session'
import { getLastProcessedCommentDate, saveLastProcessedCommentDate } from '@/src/server/datastore/environment'
import { getRecentComments } from '@/src/server/datastore/comments'
import { Entity, getID, getKeyedEntities } from '@/src/server/datastore/datastore'
import { Comment } from '@/types'
import { toUser } from '@/src/server/datastore/users'
import { FormatDate } from '@/src/common/formatting'
import { ChainRoute, PromptRoute } from '@/src/common/clientRoute'

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
  const replyToCommentsData = await getKeyedEntities(
    Entity.COMMENT,
    replyToCommentIDs.filter(id => id)
  )

  const versionIDs = [...new Set(recentComments.map(comment => comment.versionID))]
  const versionsData = await getKeyedEntities(Entity.VERSION, versionIDs)

  const targetToComments: { [userID: number]: { [parentID: number]: Comment[] } } = {}
  for (const comment of recentComments.slice().reverse()) {
    const version = versionsData.find(data => getID(data) === comment.versionID)
    const replyToComment = replyToCommentsData.find(data => getID(data) === comment.replyTo)
    const targetUserID = replyToComment?.userID ?? version?.userID
    if (version && targetUserID && targetUserID !== comment.userID) {
      const parentID = version.parentID
      const commentsForTarget = targetToComments[targetUserID] ?? {}
      const commentsWithSameParent = commentsForTarget[parentID] ?? []
      commentsForTarget[parentID] = [...commentsWithSameParent, comment]
      targetToComments[targetUserID] = commentsForTarget
    }
  }

  const commenterIDs = [...new Set(recentComments.map(comment => comment.userID))]
  const usersData = await getKeyedEntities(Entity.USER, [...commenterIDs, ...Object.keys(targetToComments).map(Number)])
  const users = usersData.map(toUser)

  const promptIDs = versionsData.filter(data => !!data.prompts).map(data => data.parentID)
  const promptsData = await getKeyedEntities(Entity.PROMPT, promptIDs)
  const chainIDs = versionsData.filter(data => !!data.items).map(data => data.parentID)
  const chainsData = await getKeyedEntities(Entity.CHAIN, chainIDs)

  const projectIDs = [...new Set([...promptsData, ...chainsData].map(data => data.projectID))]
  const projectsData = await getKeyedEntities(Entity.PROJECT, projectIDs)

  for (const [targetUserID, commentsForTarget] of Object.entries(targetToComments)) {
    const targetUser = users.find(user => user.id === Number(targetUserID))
    console.log(`================================================================================`)
    console.log(`Notifications for ${targetUser?.fullName} (${targetUser?.email}):`)
    console.log(`================================================================================`)
    for (const [parentIDKey, comments] of Object.entries(commentsForTarget).sort(
      ([_, [a]], [__, [b]]) => a.timestamp - b.timestamp
    )) {
      const parentID = Number(parentIDKey)
      const chain = chainsData.find(data => getID(data) === parentID)
      const prompt = promptsData.find(data => getID(data) === parentID)
      const parent = chain ?? prompt
      const parentName = `${chain ? 'chain' : 'prompt'} “${parent?.name}”`
      const project = projectsData.find(data => getID(data) === parent?.projectID)
      const route = chain ? ChainRoute(parent.projectID, parentID) : PromptRoute(parent.projectID, parentID)
      console.log(`→ New comments on ${parentName} in project “${project.name}”:`)
      for (const comment of comments) {
        const commenter = users.find(user => user.id === comment.userID)
        const textForComment = (comment: Comment) => {
          switch (comment.action) {
            case 'addLabel':
              return `Added “${comment.text}”`
            case 'removeLabel':
              return `Removed “${comment.text}”`
            default:
              return comment.text
          }
        }
        console.log(`• ${commenter?.fullName} (${commenter?.email}) ${FormatDate(comment.timestamp)}`)
        console.log(textForComment(comment))
      }
      console.log(`View: ${process.env.NEXTAUTH_URL}${route}`)
      console.log('--------------------------------------------------------------------------------')
    }
  }

  if (recentComments.length > 0) {
    // await saveLastProcessedCommentDate(new Date(recentComments[0].timestamp))
  }

  res.status(200).json({})
}

// TODO switch back to withCronRoute AND uncomment line above
export default withAdminUserRoute(handler)
