import { Comment, CommentAction } from '@/types'
import { Entity, buildKey, getDatastore, getID, getRecentEntities, getTimestamp } from './datastore'
import { ensureProjectAccess } from './projects'

export async function migrateComments(postMerge: boolean) {
  if (!postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allComments] = await datastore.runQuery(datastore.createQuery(Entity.COMMENT))
  const usedParentIDs = new Set(allComments.map(commentData => commentData.parentID))
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))
  const allParentIDs = new Set([...allPrompts.map(prompt => getID(prompt)), ...allChains.map(chain => getID(chain))])
  console.log(`Found ${allComments.length} comments (for ${usedParentIDs.size} parents out of ${allParentIDs.size})`)
  for (const commentData of allComments) {
    if (!allParentIDs.has(commentData.parentID)) {
      console.log(`Deleting comment ${getID(commentData)} for missing parent ${commentData.parentID}`)
      await datastore.delete(buildKey(Entity.COMMENT, getID(commentData)))
    }
  }
//   for (const commentData of allComments) {
//     await datastore.save(
//       toCommentData(
//         commentData.userID,
//         commentData.projectID,
//         commentData.parentID,
//         commentData.versionID,
//         commentData.text,
//         commentData.createdAt,
//         commentData.replyTo,
//         commentData.action,
//         commentData.quote,
//         commentData.runID,
//         commentData.itemIndex,
//         commentData.startIndex,
//         getID(commentData)
//       )
//     )
//   }
}

export async function saveComment(
  userID: number,
  projectID: number,
  parentID: number,
  versionID: number,
  text: string,
  replyTo?: number,
  action?: CommentAction,
  runID?: number,
  quote?: string,
  itemIndex?: number,
  startIndex?: number
) {
  await ensureProjectAccess(userID, projectID)
  const commentData = toCommentData(
    userID,
    projectID,
    parentID,
    versionID,
    text,
    new Date(),
    replyTo,
    action,
    quote,
    runID,
    itemIndex,
    startIndex
  )
  await getDatastore().save(commentData)
  return toComment({ ...commentData.data, key: commentData.key })
}

const toCommentData = (
  userID: number,
  projectID: number,
  parentID: number,
  versionID: number,
  text: string,
  createdAt: Date,
  replyTo?: number,
  action?: CommentAction,
  quote?: string,
  runID?: number,
  itemIndex?: number,
  startIndex?: number,
  commentID?: number
) => ({
  key: buildKey(Entity.COMMENT, commentID),
  data: {
    userID,
    projectID,
    parentID,
    versionID,
    replyTo,
    text,
    createdAt,
    action,
    quote,
    runID,
    itemIndex,
    startIndex,
  },
  excludeFromIndexes: ['text', 'action', 'quote', 'runID', 'itemIndex', 'startIndex'],
})

export const toComment = (data: any): Comment => ({
  id: getID(data),
  userID: data.userID,
  parentID: data.parentID,
  versionID: data.versionID,
  text: data.text,
  timestamp: getTimestamp(data),
  replyTo: data.replyTo ?? null,
  action: data.action ?? null,
  quote: data.quote ?? null,
  runID: data.runID ?? null,
  itemIndex: data.itemIndex ?? null,
  startIndex: data.startIndex ?? null,
})

export async function getRecentComments(
  since: Date,
  before: Date | undefined,
  limit: number,
  pagingBackwards = false
): Promise<Comment[]> {
  const recentCommentsData = await getRecentEntities(Entity.COMMENT, limit, since, before, 'createdAt', pagingBackwards)
  return recentCommentsData.map(toComment)
}
