import { CheckValidEmail } from '@/src/common/formatting'
import { Entity, getEntityKey, getFilteredEntityCount, getID } from '@/src/server/datastore/datastore'
import { addProjectForUser } from '@/src/server/datastore/projects'
import { addPromptForUser, deletePromptForUser } from '@/src/server/datastore/prompts'
import { getUserForEmail, saveUser } from '@/src/server/datastore/users'
import { saveChainVersionForUser, savePromptVersionForUser } from '@/src/server/datastore/versions'
import { addWorkspaceForUser } from '@/src/server/datastore/workspaces'
import { getAPIBaseURLForProject } from '@/src/server/routing'
import { withErrorRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import { readFileSync } from 'fs'
import { deserializeCodeBlock, deserializePromptVersion } from '@/src/server/serialize'
import { addChainForUser } from '@/src/server/datastore/chains'

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
  await addPredictionEndpoint(adminUser.id, projectID)

  res.json({
    _PLAYFETCH_API_KEY: '1234',
    _PLAYFETCH_ENDPOINT_URL: `${getAPIBaseURLForProject(projectID)}`,
  })
}

const addPredictionEndpoint = async (userID: number, projectID: number) => {
  const { promptID, promptVersionID } = await addPrompt(userID, projectID, 'Predict Rating', 'prediction')

  const { chainID, versionID } = await addChainForUser(userID, projectID, 'Predict Rating')
  const chainVersionID = await saveChainVersionForUser(userID, chainID, [
    {
      code: loadCodeBlock('prePrediction'),
      branch: 0,
      output: "recentRatings",
      inputs: ["recentRatings"],
    },
    {
      promptID,
      versionID: promptVersionID,
      branch: 0,
      output: "response",
      inputs: ["recentRatings", "inputs", "output"],
      dynamicInputs: [],
    },
    {
      code: loadCodeBlock('postPrediction'),
      branch: 0,
      inputs: ["response"],
    },
  ], versionID, versionID)
}

const addPrompt = async (userID: number, projectID: number, name: string, type: PromptType) => {
  const { promptID, versionID } = await addPromptForUser(userID, projectID, name)
  const { prompts, config } = loadPrompt(type)
  const promptVersionID = await savePromptVersionForUser(userID, promptID, prompts, config, versionID, versionID)
  return { promptID, promptVersionID }
}

type PromptType = 'prediction' | 'suggestion' | 'generation'

const loadPrompt = (type: PromptType) =>
  deserializePromptVersion(loadTemplate(`${type}Prompt.yaml`))

const loadCodeBlock = (type: 'prePrediction' | 'postPrediction' | 'suggestion') =>
  deserializeCodeBlock(loadTemplate(`${type}Code.yaml`))

const loadTemplate = (fileName: string) => readFileSync(path.join(process.cwd(), 'templates', fileName), 'utf8')

export default withErrorRoute(init)
