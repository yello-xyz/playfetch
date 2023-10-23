import { Comment, CommentAction } from '@/types'
import {
  Entity,
  beforeDateFilter,
  buildFilter,
  buildKey,
  getDatastore,
  getFilteredEntities,
  getID,
  getRecentEntities,
  getTimestamp,
} from './datastore'
import { ensurePromptOrChainAccess } from './chains'
import { and } from '@google-cloud/datastore'

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

export async function getRecentComments(
  since: Date,
  before: Date | undefined,
  limit: number,
  pagingBackwards = false
): Promise<Comment[]> {
  const recentCommentsData = await getRecentEntities(Entity.COMMENT, limit, since, before, 'createdAt', pagingBackwards)
  return recentCommentsData.map(toComment)
}

export async function getEarlierCommentsForVersion(versionID: number, before: Date, limit: number): Promise<Comment[]> {
  const earlierComments = await getFilteredEntities(
    Entity.COMMENT,
    and([buildFilter('versionID', versionID), beforeDateFilter(before)]),
    limit
  )
  return earlierComments.map(toComment)
}
