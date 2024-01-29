import { saveComment } from '@/src/server/datastore/comments'
import { getProjectUserForEmail } from '@/src/server/datastore/projects'
import { getTaskForIdentifier } from '@/src/server/datastore/tasks'
import { getTrustedVersion, toggleVersionLabels } from '@/src/server/datastore/versions'
import { getActorEmailForID, getActorEmailForIssueState } from '@/src/server/linear'
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
    console.log('WEBHOOK PAYLOAD', body)
    const { type, action, data, updatedFrom } = body
    if (data && webhook.verify(buffer, signature, body[LINEAR_WEBHOOK_TS_FIELD])) {
      if (
        type === 'Issue' &&
        action === 'update' &&
        data.completedAt !== null &&
        updatedFrom?.completedAt === null &&
        data.state?.type === 'completed'
      ) {
        processCompletedTask(body.data.id, body.data.state.id)
      } else if (type === 'Comment' && action === 'create' && data.issueId && data.userId && data.body) {
        processComment(data.issueId, data.userId, data.body)
      } else {
        console.log(type, action, data.issueId, data.userId, data.body)
      }
    }
  }
  res.status(200).json({})
}

async function processCompletedTask(issueID: string, stateID: string) {
  const task = await getTaskForIdentifier(issueID, true)
  if (task) {
    const { versionID, userID, projectID, labels } = task
    const email = await getActorEmailForIssueState(userID, issueID, stateID)
    const projectUser = email ? await getProjectUserForEmail(projectID, email) : undefined
    const actorID = projectUser?.id ?? userID
    await toggleVersionLabels(actorID, versionID, projectID, labels)
  }
}

async function processComment(issueID: string, actorID: string, comment: string) {
  const task = await getTaskForIdentifier(issueID)
  console.log(issueID, task)
  if (task) {
    const { versionID, userID, projectID } = task
    const email = await getActorEmailForID(userID, actorID)
    const projectUser = email ? await getProjectUserForEmail(projectID, email) : undefined
    console.log(email, projectUser)
    if (projectUser) {
      const version = await getTrustedVersion(versionID, true)
      console.log(comment, versionID)
      await saveComment(projectUser.id, projectID, version.parentID, versionID, comment)
    }
  }
}

export default withErrorRoute(linear)
