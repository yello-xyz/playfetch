import { hasUserAccess } from '@/src/server/datastore/access'
import { getProjectUserForEmail } from '@/src/server/datastore/projects'
import { getTaskForIdentifier } from '@/src/server/datastore/tasks'
import { getUserForEmail } from '@/src/server/datastore/users'
import { toggleVersionLabels } from '@/src/server/datastore/versions'
import { getActorEmailForIssueState } from '@/src/server/linear'
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
    if (
      body.type === 'Issue' &&
      body.data &&
      body.data.completedAt !== null &&
      body.updatedFrom?.completedAt === null &&
      body.data.state?.type === 'completed' &&
      webhook.verify(buffer, signature, body[LINEAR_WEBHOOK_TS_FIELD])
    ) {
      processCompletedTask(body.data.id, body.data.state.id)
    }
  }
  res.status(200).json({})
}

async function processCompletedTask(taskID: string, stateID: string) {
  const task = await getTaskForIdentifier(taskID, true)
  if (task) {
    const { versionID, userID, projectID, labels } = task
    const email = await getActorEmailForIssueState(userID, taskID, stateID)
    const projectUser = email ? await getProjectUserForEmail(projectID, email) : undefined
    await toggleVersionLabels(projectUser?.id ?? userID, versionID, projectID, labels)
  }
}

export default withErrorRoute(linear)
