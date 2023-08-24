import { PromptConfig, Version } from '@/types'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getEntityCount,
  getEntityKey,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getTimestamp,
} from './datastore'
import { toRun } from './runs'
import { augmentPromptDataWithNewVersion, getVerifiedUserPromptData, updatePrompt } from './prompts'
import { augmentProjectWithNewVersion, ensureProjectLabel } from './projects'
import { saveComment, toComment } from './comments'
import { DefaultConfig } from '@/src/common/defaultConfig'
import { VersionsEqual } from '@/src/common/versionsEqual'
import { ensurePromptOrChainAccess } from './chains'

export async function migrateVersions(postMerge: boolean) {
  const datastore = getDatastore()
  const [allVersions] = await datastore.runQuery(datastore.createQuery(Entity.VERSION))
  for (const versionData of allVersions) {
    await datastore.save(
      toVersionData(
        versionData.userID,
        versionData.parentID ?? versionData.promptID,
        versionData.prompt,
        versionData.config ? JSON.parse(versionData.config) : null,
        JSON.parse(versionData.labels),
        versionData.createdAt,
        versionData.previousVersionID,
        getID(versionData),
        postMerge && versionData.parentID ? undefined : versionData.promptID
      )
    )
  }
}

const isVersionDataCompatible = (versionData: any, prompt: string, config: PromptConfig) =>
  VersionsEqual({ prompt: versionData.prompt, config: JSON.parse(versionData.config) }, { prompt, config })

const getVerifiedUserVersionData = async (userID: number, versionID: number) => {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  if (!versionData) {
    throw new Error(`Version with ID ${versionID} does not exist or user has no access`)
  }
  await ensurePromptOrChainAccess(userID, versionData.parentID)
  return versionData
}

export async function getTrustedVersion(versionID: number) {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  return toVersion(versionData, [], [])
}

export async function saveVersionForUser(
  userID: number,
  parentID: number,
  prompt: string = '',
  config: PromptConfig = DefaultConfig,
  currentVersionID?: number
) {
  const datastore = getDatastore()
  const promptData = await getVerifiedUserPromptData(userID, parentID)

  let currentVersion = currentVersionID ? await getKeyedEntity(Entity.VERSION, currentVersionID) : undefined
  const canOverwrite =
    currentVersionID &&
    (isVersionDataCompatible(currentVersion, prompt, config) ||
      !(await getEntity(Entity.RUN, 'versionID', currentVersionID)))

  if (canOverwrite && !isVersionDataCompatible(currentVersion, prompt, config)) {
    const previousVersion = currentVersion.previousVersionID
      ? await getKeyedEntity(Entity.VERSION, currentVersion.previousVersionID)
      : undefined
    if (previousVersion && isVersionDataCompatible(previousVersion, prompt, config)) {
      await datastore.delete(buildKey(Entity.VERSION, currentVersionID))
      currentVersionID = currentVersion.previousVersionID
      currentVersion = previousVersion
    }
  }

  const versionID = canOverwrite ? currentVersionID : undefined
  const previousVersionID = canOverwrite ? currentVersion.previousVersionID : currentVersionID
  const createdAt = canOverwrite ? currentVersion.createdAt : new Date()

  const labels = currentVersion ? JSON.parse(currentVersion.labels) : []
  const versionData = toVersionData(userID, parentID, prompt, config, labels, createdAt, previousVersionID, versionID)
  await datastore.save(versionData)
  const savedVersionID = getID(versionData)

  const lastPrompt = currentVersion ? currentVersion.prompt : ''
  await augmentPromptDataWithNewVersion(promptData, savedVersionID, prompt, lastPrompt)
  await augmentProjectWithNewVersion(promptData.projectID, prompt, lastPrompt)

  return savedVersionID
}

async function updateVersion(versionData: any) {
  await getDatastore().save(
    toVersionData(
      versionData.userID,
      versionData.parentID,
      versionData.prompt,
      versionData.config ? JSON.parse(versionData.config) : null,
      JSON.parse(versionData.labels),
      versionData.createdAt,
      versionData.previousVersionID,
      getID(versionData)
    )
  )
}

export async function processLabels(
  labels: string[],
  userID: number,
  versionID: number,
  parentID: number,
  projectID: number,
  label: string,
  checked: boolean,
  runID?: number
) {
  if (checked !== labels.includes(label)) {
    const newLabels = checked ? [...labels, label] : labels.filter(l => l !== label)
    if (checked) {
      await ensureProjectLabel(userID, projectID, label)
    }
    await saveComment(userID, parentID, versionID, label, checked ? 'addLabel' : 'removeLabel', runID)
    return newLabels
  }
  return undefined
}

export async function updateVersionLabel(
  userID: number,
  versionID: number,
  projectID: number,
  label: string,
  checked: boolean
) {
  const versionData = await getVerifiedUserVersionData(userID, versionID)
  const labels = JSON.parse(versionData.labels) as string[]
  const newLabels = await processLabels(labels, userID, versionID, versionData.parentID, projectID, label, checked)
  if (newLabels) {
    await updateVersion({ ...versionData, labels: JSON.stringify(newLabels) })
  }
}

const toVersionData = (
  userID: number,
  parentID: number,
  prompt: string | null,
  config: PromptConfig | null,
  labels: string[],
  createdAt: Date,
  previousVersionID?: number,
  versionID?: number,
  promptID?: number // TODO safe to delete this after running next post-merge data migrations in prod
) => ({
  key: buildKey(Entity.VERSION, versionID),
  data: {
    userID,
    parentID,
    prompt,
    config: config ? JSON.stringify(config) : null,
    labels: JSON.stringify(labels),
    createdAt,
    previousVersionID,
    promptID,
  },
  excludeFromIndexes: ['prompt', 'config', 'labels'],
})

export const toVersion = (data: any, runs: any[], comments: any[]): Version => ({
  id: getID(data),
  parentID: data.parentID,
  userID: data.userID,
  previousID: data.previousVersionID ?? null,
  timestamp: getTimestamp(data),
  prompt: data.prompt ?? null,
  config: data.config ? JSON.parse(data.config) : null,
  labels: JSON.parse(data.labels),
  runs: runs
    .filter(run => run.versionID === getID(data))
    .map(toRun)
    .reverse(),
  comments: comments
    .filter(comment => comment.versionID === getID(data))
    .map(toComment)
    .reverse(),
})

export async function deleteVersionForUser(userID: number, versionID: number) {
  const versionData = await getVerifiedUserVersionData(userID, versionID)

  const anyEndpointKey = await getEntityKey(Entity.ENDPOINT, 'versionID', versionID)
  if (anyEndpointKey) {
    throw new Error('Cannot delete version with published endpoints')
  }

  const parentID = versionData.parentID
  const versionCount = await getEntityCount(Entity.VERSION, 'parentID', parentID)
  const wasLastVersion = versionCount === 1

  const runKeys = await getEntityKeys(Entity.RUN, 'versionID', versionID)
  const commentKeys = await getEntityKeys(Entity.COMMENT, 'versionID', versionID)
  await getDatastore().delete([...commentKeys, ...runKeys, buildKey(Entity.VERSION, versionID)])

  if (wasLastVersion) {
    await saveVersionForUser(userID, parentID)
  }

  const lastVersionData = await getEntity(Entity.VERSION, 'parentID', parentID, true)
  const promptData = await getKeyedEntity(Entity.PROMPT, parentID)
  await updatePrompt({ ...promptData, lastVersionID: getID(lastVersionData) }, true)
}
