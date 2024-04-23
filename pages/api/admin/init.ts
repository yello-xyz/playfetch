import { CheckValidEmail } from '@/src/common/formatting'
import { Entity, getEntityKey, getFilteredEntityCount, getID } from '@/src/server/datastore/datastore'
import { addProjectForUser } from '@/src/server/datastore/projects'
import { addPromptForUser, deletePromptForUser } from '@/src/server/datastore/prompts'
import { getUserForEmail, saveUser } from '@/src/server/datastore/users'
import { savePromptVersionForUser } from '@/src/server/datastore/versions'
import { addWorkspaceForUser } from '@/src/server/datastore/workspaces'
import { getAPIBaseURL } from '@/src/server/routing'
import { withErrorRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import { readFileSync } from 'fs'
import { deserializeCodeBlock, deserializePromptVersion } from '@/src/server/serialize'

async function init(req: NextApiRequest, res: NextApiResponse) {
  const userCount = await getFilteredEntityCount(Entity.USER)
  if (userCount > 0) {
    return res.status(400).json({ error: 'Datastore not empty. Init script should only be run once.' })
  }

  const adminEmail = req.query.admin as string
  if (!CheckValidEmail(adminEmail ?? '')) {
    return res.status(400).json({ error: 'Init script should specify valid email in query admin param.' })
  }

  await saveUser(adminEmail, '', true)
  const adminUser = await getUserForEmail(adminEmail)
  if (!adminUser) {
    return res.status(400).json({ error: 'Failed to add initial admin user.' })
  }

  const workspaceID = await addWorkspaceForUser(adminUser.id, 'Admin')
  const projectID = await addProjectForUser(adminUser.id, workspaceID, 'PlayFetch Features')
  const initialPromptID = getID({ key: await getEntityKey(Entity.PROMPT, 'projectID', projectID) })
  await deletePromptForUser(adminUser.id, initialPromptID)
  const promptVersionID = await addPredictionChain(adminUser.id, projectID)

  res.json({
    _PLAYFETCH_API_KEY: '1234',
    _PLAYFETCH_ENDPOINT_URL: `${getAPIBaseURL()}/${promptVersionID}`,
  })
}

async function addPredictionChain(userID: number, projectID: number) {
  const { promptID, versionID } = await addPromptForUser(userID, projectID, 'Predict Rating')
  const { prompts, config } = loadPrompt('prediction')
  const promptVersionID = await savePromptVersionForUser(userID, promptID, prompts, config, versionID, versionID)

  const prePredictionCode = loadCodeBlock('prePrediction')
  const postPredictionCode = loadCodeBlock('postPrediction')

  return promptVersionID
}

const loadPrompt = (type: 'prediction' | 'suggestion' | 'generation') =>
  deserializePromptVersion(loadTemplate(`${type}Prompt.yaml`))

const loadCodeBlock = (type: 'prePrediction' | 'postPrediction' | 'suggestion') =>
  deserializeCodeBlock(loadTemplate(`${type}Code.yaml`))

const loadTemplate = (fileName: string) => readFileSync(path.join(process.cwd(), 'templates', fileName), 'utf8')

export default withErrorRoute(init)
