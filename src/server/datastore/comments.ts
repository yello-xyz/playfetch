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
        commentData.quote,
        commentData.runID,
        commentData.action,
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
  quote?: string,
  runID?: number,
  action?: CommentAction
) {
  await ensurePromptAccess(userID, promptID)
  await getDatastore().save(toCommentData(userID, promptID, versionID, text, new Date(), quote, runID, action))
}

const toCommentData = (
  userID: number,
  promptID: number,
  versionID: number,
  text: string,
  createdAt: Date,
  quote?: string,
  runID?: number,
  action?: CommentAction,
  commentID?: number
) => ({
  key: buildKey(Entity.RUN, commentID),
  data: { userID, promptID, versionID, text, createdAt, quote, runID, action },
  excludeFromIndexes: ['text', 'quote', 'runID', 'action'],
})

export const toComment = (data: any): Comment => ({
  userID: data.userID,
  promptID: data.promptID,
  versionID: data.versionID,
  text: data.text,
  timestamp: getTimestamp(data),
  quote: data.quote ?? null,
  runID: data.runID ?? null,
  action: data.action ?? null,
})
