import { saveComment } from '@/src/server/datastore/comments'
import { getProjectUserForEmail } from '@/src/server/datastore/projects'
import { getTaskForIdentifier } from '@/src/server/datastore/tasks'
import { getUserForID } from '@/src/server/datastore/users'
import { getLastCommentForVersion, getTrustedVersion, updateVersionLabels } from '@/src/server/datastore/versions'
import { getActorForID, getIssueLabels, getLinearProjectConfig } from '@/src/server/linear'
import { withErrorRoute } from '@/src/server/session'
import { LINEAR_WEBHOOK_SIGNATURE_HEADER, LINEAR_WEBHOOK_TS_FIELD, LinearWebhooks } from '@linear/sdk'
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = { api: { bodyParser: false } }

const parsePayload: (req: NextApiRequest) => Promise<Buffer> = (req: NextApiRequest) =>
  new Promise(resolve => {
    let data = ''
    req.on('data', chunk => (data += chunk))
    req.on('end', () => resolve(Buffer.from(data)))
  })

const webhook = new LinearWebhooks(process.env.LINEAR_APP_WEBHOOK_SECRET ?? '')

async function linear(req: NextApiRequest, res: NextApiResponse) {
  const signature = req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER] as string | undefined
  if (signature) {
    const buffer = await parsePayload(req)
    const body = JSON.parse(buffer.toString())
    const { type, action, data, updatedFrom } = body
    if (data && webhook.verify(buffer, signature, body[LINEAR_WEBHOOK_TS_FIELD])) {
      if (type === 'Issue' && action === 'update' && data.labelIds && updatedFrom?.labelIds) {
        processLabels(data.id, updatedFrom.labelIds, data.labelIds)
      } else if (
        type === 'Comment' &&
        action === 'create' &&
        data.issueId &&
        data.userId &&
        data.body &&
        data.createdAt
      ) {
        processComment(data.issueId, data.userId, data.body, new Date(data.createdAt))
      }
    }
  }
  res.status(200).json({})
}

async function processLabels(issueID: string, oldLabelIDs: string[], newLabelIDs: string[]) {
  const addedIDs = newLabelIDs.filter(id => !oldLabelIDs.includes(id))
  const removedIDs = oldLabelIDs.filter(id => !newLabelIDs.includes(id))
  if (addedIDs.length > 0 || removedIDs.length > 0) {
    const task = await getTaskForIdentifier(issueID)
    if (task) {
      const { versionID, userID, projectID } = task
      const config = await getLinearProjectConfig(projectID)
      if (config && config.syncLabels) {
        const { actorID, addedLabels, removedLabels } = await getIssueLabels(projectID, issueID, addedIDs, removedIDs)
        const projectUser = await getProjectUserForActor(userID, projectID, actorID)
        if (projectUser) {
          await updateVersionLabels(projectUser.id, versionID, projectID, addedLabels, removedLabels)
        }
      }
    }
  }
}

async function processComment(issueID: string, actorID: string, comment: string, createdAt: Date) {
  const task = await getTaskForIdentifier(issueID)
  if (task) {
    const { versionID, userID, projectID } = task
    const config = await getLinearProjectConfig(projectID)
    if (config && config.syncComments) {
      const projectUser = await getProjectUserForActor(userID, projectID, actorID)
      if (projectUser) {
        const version = await getTrustedVersion(versionID, true)
        const lastComment = await getLastCommentForVersion(versionID)
        if (!lastComment || new Date(lastComment.timestamp) < createdAt) {
          await saveComment(projectUser.id, projectID, version.parentID, versionID, comment, createdAt)
        }
      }
    }
  }
}

const getProjectUserForActor = async (userID: number, projectID: number, actorID: string | null) => {
  const { email, name } = actorID ? await getActorForID(projectID, actorID) : { email: null, name: null }
  const projectUser = email ? await getProjectUserForEmail(projectID, email) : undefined
  if (!projectUser && name) {
    const user = await getUserForID(userID)
    if (user.fullName === name) {
      return user
    }
  }
  return projectUser
}

export default withErrorRoute(linear)
