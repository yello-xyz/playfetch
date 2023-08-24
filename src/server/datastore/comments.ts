import { Comment, CommentAction } from '@/types'
import { Entity, buildKey, getDatastore, getID, getTimestamp } from './datastore'
import { ensurePromptAccess } from './prompts'

export async function migrateComments() {
  const datastore = getDatastore()
  const [allComments] = await datastore.runQuery(datastore.createQuery(Entity.COMMENT))
  for (const commentData of allComments) {
    await datastore.save(
      toCommentData(
        commentData.userID,
        commentData.promptID,
        commentData.versionID,
        commentData.text,
        commentData.createdAt,
        commentData.action,
        commentData.quote,
        commentData.runID,
        commentData.startIndex,
        getID(commentData)
      )
    )
  }
}

export async function saveComment(
  userID: number,
  promptID: number,
  versionID: number,
  text: string,
  action?: CommentAction,
  runID?: number,
  quote?: string,
  startIndex?: number
) {
  await ensurePromptAccess(userID, promptID)
  await getDatastore().save(
    toCommentData(userID, promptID, versionID, text, new Date(), action, quote, runID, startIndex)
  )
}

const toCommentData = (
  userID: number,
  promptID: number,
  versionID: number,
  text: string,
  createdAt: Date,
  action?: CommentAction,
  quote?: string,
  runID?: number,
  startIndex?: number,
  commentID?: number
) => ({
  key: buildKey(Entity.COMMENT, commentID),
  data: { userID, promptID, versionID, text, createdAt, action, quote, runID, startIndex },
  excludeFromIndexes: ['text', 'action', 'quote', 'runID', 'startIndex'],
})

export const toComment = (data: any): Comment => ({
  userID: data.userID,
  versionID: data.versionID,
  text: data.text,
  timestamp: getTimestamp(data),
  action: data.action ?? null,
  quote: data.quote ?? null,
  runID: data.runID ?? null,
  startIndex: data.startIndex ?? null,
})
