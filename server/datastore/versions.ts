import { PromptConfig, Version } from '@/types'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getEntityCount,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getTimestamp,
  toID,
} from './datastore'
import { toRun } from './runs'
import { DefaultPromptName, getVerifiedUserPromptData, updatePrompt } from './prompts'
import { StripPromptSentinels } from '@/common/formatting'
import { ensureProjectLabels } from './projects'

export async function migrateVersions() {
  const datastore = getDatastore()
  const [allVersions] = await datastore.runQuery(datastore.createQuery(Entity.VERSION))
  for (const versionData of allVersions) {
    await updateVersion({ ...versionData })
  }
}

const isVersionDataCompatible = (versionData: any, prompt: string, config: PromptConfig) => {
  const versionConfig = JSON.parse(versionData.config) as PromptConfig
  return (
    versionData.prompt === prompt &&
    versionConfig.provider === config.provider &&
    versionConfig.temperature === config.temperature &&
    versionConfig.maxTokens === config.maxTokens
  )
}

const DefaultConfig: PromptConfig = {
  provider: 'openai',
  temperature: 0.5,
  maxTokens: 250,
}

export async function saveVersionForUser(
  userID: number,
  promptID: number,
  prompt: string = '',
  config: PromptConfig = DefaultConfig,
  currentVersionID?: number
) {
  const datastore = getDatastore()
  const promptData = await getVerifiedUserPromptData(userID, promptID)

  let currentVersion = currentVersionID ? await getKeyedEntity(Entity.VERSION, currentVersionID) : undefined
  const canOverwrite =
    currentVersionID &&
    (isVersionDataCompatible(currentVersion, prompt, config) ||
      !(await getEntity(Entity.RUN, 'versionID', currentVersionID)))

  if (canOverwrite && !isVersionDataCompatible(currentVersion, prompt, config)) {
    const previousVersion = currentVersion.previousVersionID
      ? await getKeyedEntity(Entity.VERSION, currentVersion.previousVersionID)
      : undefined
    if (isVersionDataCompatible(previousVersion, prompt, config)) {
      await datastore.delete(buildKey(Entity.VERSION, currentVersionID))
      currentVersionID = currentVersion.previousVersionID
      currentVersion = previousVersion
    }
  }

  const versionID = canOverwrite ? currentVersionID : undefined
  const previousVersionID = canOverwrite ? currentVersion.previousVersionID : currentVersionID
  const createdAt = canOverwrite ? currentVersion.createdAt : new Date()

  const labels = currentVersion?.labels ?? []
  const versionData = toVersionData(userID, promptID, prompt, config, labels, createdAt, previousVersionID, versionID)
  await datastore.save(versionData)
  const name =
    promptData.name === DefaultPromptName && prompt.length && !promptData.prompt.length
      ? StripPromptSentinels(prompt).split(' ').slice(0, 3).join(' ')
      : promptData.name
  await updatePrompt({ ...promptData, prompt, name }, true)

  return toID(versionData)
}

async function updateVersion(versionData: any) {
  await getDatastore().save(
    toVersionData(
      versionData.userID,
      versionData.promptID,
      versionData.prompt,
      JSON.parse(versionData.config),
      JSON.parse(versionData.labels),
      versionData.createdAt,
      versionData.previousVersionID,
      getID(versionData)
    )
)
}

export async function saveVersionLabels(
  userID: number,
  versionID: number,
  projectID: number,
  labels: string[]
) {
  const versionData = await getVerifiedUserVersionData(userID, versionID)
  await updateVersion({ ...versionData, labels: JSON.stringify(labels) })
  await ensureProjectLabels(userID, projectID, labels)
}

const toVersionData = (
  userID: number,
  promptID: number,
  prompt: string,
  config: PromptConfig,
  labels: string[],
  createdAt: Date,
  previousVersionID?: number,
  versionID?: number
) => ({
  key: buildKey(Entity.VERSION, versionID),
  data: {
    userID,
    promptID,
    prompt,
    config: JSON.stringify(config),
    labels: JSON.stringify(labels),
    createdAt,
    previousVersionID,
  },
  excludeFromIndexes: ['prompt', 'config', 'labels'],
})

export const toVersion = (data: any, runs: any[]): Version => ({
  id: getID(data),
  previousID: data.previousVersionID ?? null,
  timestamp: getTimestamp(data),
  prompt: data.prompt,
  config: JSON.parse(data.config),
  labels: JSON.parse(data.labels),
  runs: runs.filter(run => run.versionID === getID(data)).map(toRun),
})

const getVerifiedUserVersionData = async (userID: number, versionID: number) => {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  if (!versionData || versionData?.userID !== userID) {
    throw new Error(`Version with ID ${versionID} does not exist or user has no access`)
  }
  return versionData
}

export async function deleteVersionForUser(userID: number, versionID: number) {
  const versionData = await getVerifiedUserVersionData(userID, versionID)
  const promptID = versionData.promptID
  const versionCount = await getEntityCount(Entity.VERSION, 'promptID', promptID)
  if (versionCount <= 1) {
    throw new Error(`Cannot delete last version for prompt ${promptID}`)
  }

  const keysToDelete = await getEntityKeys(Entity.RUN, 'versionID', versionID)
  keysToDelete.push(buildKey(Entity.VERSION, versionID))
  await getDatastore().delete(keysToDelete)

  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  const lastVersionData = await getEntity(Entity.VERSION, 'promptID', promptID, true)
  await updatePrompt({ ...promptData, prompt: lastVersionData.prompt }, true)
}
