import { Comment, CommentAction } from '@/types'
import { Entity, buildKey, getDatastore, getEntities, getID, getRecentEntities, getTimestamp } from './datastore'
import { ensureProjectAccess } from './projects'

const IsReplyToComment = (comment: Comment) => (candidate: Comment) =>
  candidate.versionID === comment.versionID &&
  candidate.timestamp < comment.timestamp &&
  candidate.userID !== comment.userID &&
  candidate.runID === comment.runID &&
  candidate.itemIndex === comment.itemIndex &&
  candidate.startIndex === comment.startIndex &&
  ((!comment.action && !candidate.action) ||
    (comment.action && candidate.action && candidate.action !== comment.action && candidate.text === comment.text))

export async function migrateComments(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allComments] = await datastore.runQuery(datastore.createQuery(Entity.COMMENT))
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))

  const projectIDMap = new Map<number, number>()
  for (const data of [...allPrompts, ...allChains]) {
    projectIDMap.set(getID(data), data.projectID)
  }

  for (const commentData of allComments.filter(data => !data.projectID)) {
    const projectID = projectIDMap.get(commentData.parentID) as number
    let replyTo = commentData.replyTo
    if (!replyTo) {
      const previousCommentsData = await getEntities(Entity.COMMENT, 'versionID', commentData.versionID)
      const previousComments = previousCommentsData.map(toComment)
      const comment = toComment(commentData)
      const replyToComment = previousComments.find(IsReplyToComment(comment))
      replyTo = replyToComment?.id
    }
    await datastore.save(
      toCommentData(
        commentData.userID,
        projectID,
        commentData.parentID,
        commentData.versionID,
        commentData.text,
        commentData.createdAt,
        replyTo,
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
