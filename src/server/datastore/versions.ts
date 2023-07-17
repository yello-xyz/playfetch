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
} from './datastore'
import { toRun } from './runs'
import { DefaultPromptName, ensurePromptAccess, getVerifiedUserPromptData, updatePrompt } from './prompts'
import { StripPromptSentinels } from '@/src/common/formatting'
import { ensureProjectLabel } from './projects'
import { saveComment, toComment } from './comments'
import { DefaultConfig } from '@/src/common/defaultConfig'
import { VersionsEqual } from '@/src/common/versionsEqual'

export async function migrateVersions() {
  const datastore = getDatastore()
  const [allVersions] = await datastore.runQuery(datastore.createQuery(Entity.VERSION))
  for (const versionData of allVersions) {
    await updateVersion({ ...versionData })
  }
}

const isVersionDataCompatible = (versionData: any, prompt: string, config: PromptConfig) =>
  VersionsEqual({ prompt: versionData.prompt, config: JSON.parse(versionData.config) }, { prompt, config })

const getVerifiedUserVersionData = async (userID: number, versionID: number) => {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  if (!versionData) {
    throw new Error(`Version with ID ${versionID} does not exist or user has no access`)
  }
  await ensurePromptAccess(userID, versionData.promptID)
  return versionData
}

export async function getVersion(versionID: number) {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  return toVersion(versionData, [], [])
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
  const versionData = toVersionData(userID, promptID, prompt, config, labels, createdAt, previousVersionID, versionID)
  await datastore.save(versionData)
  const name =
    promptData.name === DefaultPromptName && prompt.length && !promptData.prompt.length
      ? StripPromptSentinels(prompt).split(' ').slice(0, 5).join(' ')
      : promptData.name
  const savedVersionID = getID(versionData)
  await updatePrompt({ ...promptData, lastVersionID: savedVersionID, lastPrompt: prompt, name }, true)

  return savedVersionID
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

export async function toggleVersionLabel(
  userID: number,
  versionID: number,
  promptID: number,
  projectID: number,
  label: string,
  checked: boolean
) {
  const versionData = await getVerifiedUserVersionData(userID, versionID)
  const labels = JSON.parse(versionData.labels) as string[]
  if (checked !== labels.includes(label)) {
    const newLabels = checked ? [...labels, label] : labels.filter(l => l !== label)
    await updateVersion({ ...versionData, labels: JSON.stringify(newLabels) })
    if (checked) {
      await ensureProjectLabel(userID, projectID, label)
    }
    await saveComment(userID, promptID, versionID, label, checked ? 'addLabel' : 'removeLabel')
  }
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

export const toVersion = (data: any, runs: any[], comments: any[]): Version => ({
  id: getID(data),
  promptID: data.promptID,
  userID: data.userID,
  previousID: data.previousVersionID ?? null,
  timestamp: getTimestamp(data),
  prompt: data.prompt,
  config: JSON.parse(data.config),
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
  const promptID = versionData.promptID
  const versionCount = await getEntityCount(Entity.VERSION, 'promptID', promptID)
  const wasLastVersion = versionCount === 1

  const runKeys = await getEntityKeys(Entity.RUN, 'versionID', versionID)
  const commentKeys = await getEntityKeys(Entity.COMMENT, 'versionID', versionID)
  await getDatastore().delete([...commentKeys, ...runKeys, buildKey(Entity.VERSION, versionID)])

  if (wasLastVersion) {
    await saveVersionForUser(userID, promptID)
  }

  const lastVersionData = await getEntity(Entity.VERSION, 'promptID', promptID, true)
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  await updatePrompt({ ...promptData, lastVersionID: getID(lastVersionData), lastPrompt: lastVersionData.prompt }, true)
}
