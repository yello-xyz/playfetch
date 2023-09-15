import { Comment, CommentAction } from '@/types'
import { Entity, buildKey, getDatastore, getID, getTimestamp } from './datastore'
import { ensurePromptOrChainAccess } from './chains'

export async function migrateComments() {
  const datastore = getDatastore()
  const [allComments] = await datastore.runQuery(datastore.createQuery(Entity.COMMENT))
  for (const commentData of allComments) {
    await datastore.save(
      toCommentData(
        commentData.userID,
        commentData.parentID,
        commentData.versionID,
        commentData.text,
        commentData.createdAt,
        commentData.action,
        commentData.quote,
        commentData.runID,
        commentData.itemIndex,
        commentData.startIndex,
        getID(commentData)
      )
    )
  }
}

export async function saveComment(
  userID: number,
  parentID: number,
  versionID: number,
  text: string,
  action?: CommentAction,
  runID?: number,
  quote?: string,
  itemIndex?: number,
  startIndex?: number
) {
  await ensurePromptOrChainAccess(userID, parentID)
  const commentData = toCommentData(
    userID,
    parentID,
    versionID,
    text,
    new Date(),
    action,
    quote,
    runID,
    itemIndex,
    startIndex
  )
  await getDatastore().save(commentData)
  return toComment(commentData.data)
}

const toCommentData = (
  userID: number,
  parentID: number,
  versionID: number,
  text: string,
  createdAt: Date,
  action?: CommentAction,
  quote?: string,
  runID?: number,
  itemIndex?: number,
  startIndex?: number,
  commentID?: number
) => ({
  key: buildKey(Entity.COMMENT, commentID),
  data: { userID, parentID, versionID, text, createdAt, action, quote, runID, itemIndex, startIndex },
  excludeFromIndexes: ['text', 'action', 'quote', 'runID', 'itemIndex', 'startIndex'],
})

export const toComment = (data: any): Comment => ({
  userID: data.userID,
  versionID: data.versionID,
  text: data.text,
  timestamp: getTimestamp(data),
  action: data.action ?? null,
  quote: data.quote ?? null,
  runID: data.runID ?? null,
  itemIndex: data.itemIndex ?? null,
  startIndex: data.startIndex ?? null,
})
