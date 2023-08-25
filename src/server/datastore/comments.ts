import { Comment, CommentAction } from '@/types'
import { Entity, buildKey, getDatastore, getID, getTimestamp } from './datastore'
import { ensurePromptOrChainAccess } from './chains'

export async function migrateComments(postMerge: boolean) {
  const datastore = getDatastore()
  const [allComments] = await datastore.runQuery(datastore.createQuery(Entity.COMMENT))
  for (const commentData of allComments) {
    await datastore.save(
      toCommentData(
        commentData.userID,
        commentData.parentID ?? commentData.promptID,
        commentData.versionID,
        commentData.text,
        commentData.createdAt,
        commentData.action,
        commentData.quote,
        commentData.runID,
        commentData.startIndex,
        getID(commentData),
        postMerge && commentData.parentID ? undefined : commentData.promptID
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
  startIndex?: number
) {
  await ensurePromptOrChainAccess(userID, parentID)
  await getDatastore().save(
    toCommentData(userID, parentID, versionID, text, new Date(), action, quote, runID, startIndex)
  )
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
  startIndex?: number,
  commentID?: number,
  promptID?: number // TODO safe to delete this after running next post-merge data migrations in prod
) => ({
  key: buildKey(Entity.COMMENT, commentID),
  data: { userID, parentID, versionID, text, createdAt, action, quote, runID, startIndex, promptID },
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
