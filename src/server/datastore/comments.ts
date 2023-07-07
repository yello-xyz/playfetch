import { Comment, CommentAction } from '@/types'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity, getTimestamp } from './datastore'
import { ensurePromptAccess } from './prompts'

export async function migrateComments() {
  const datastore = getDatastore()
  const [allComments] = await datastore.runQuery(datastore.createQuery(Entity.COMMENT))
  for (const commentData of allComments) {
    let startIndex = undefined
    if (commentData.runID ) {
      const runData = await getKeyedEntity(Entity.RUN, commentData.runID)
      startIndex = runData.output.indexOf(commentData.quote)
    }
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
        startIndex,
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
  quote?: string,
  runID?: number,
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
  promptID: data.promptID,
  versionID: data.versionID,
  text: data.text,
  timestamp: getTimestamp(data),
  action: data.action ?? null,
  quote: data.quote ?? null,
  runID: data.runID ?? null,
  startIndex: data.startIndex ?? null,
})
