import { ChainItemWithInputs, PromptConfig, Prompts, RawChainVersion, RawPromptVersion } from '@/types'
import {
  Entity,
  allocateID,
  buildKey,
  getDatastore,
  getEntityCount,
  getEntityKey,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getTimestamp,
} from './datastore'
import { toRun } from './runs'
import {
  augmentPromptDataWithNewVersion,
  ensurePromptAccess,
  getVerifiedUserPromptData,
  updatePromptOnDeletedVersion,
} from './prompts'
import { augmentProjectWithNewVersion, ensureProjectLabel } from './projects'
import { saveComment, toComment } from './comments'
import { DefaultConfig } from '@/src/common/defaultConfig'
import { ChainVersionsAreEqual, PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import {
  augmentChainDataWithNewVersion,
  ensureChainAccess,
  getVerifiedUserChainData,
  updateChainOnDeletedVersion,
} from './chains'

export async function migrateVersions(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allVersions] = await datastore.runQuery(datastore.createQuery(Entity.VERSION))
  for (const versionData of allVersions) {
    if (versionData.items) {
      await datastore.save(
        toVersionData(
          versionData.userID,
          versionData.parentID,
          versionData.prompts ? JSON.parse(versionData.prompts) : null,
          versionData.config ? JSON.parse(versionData.config) : null,
          versionData.items ? JSON.parse(versionData.items) : null,
          JSON.parse(versionData.labels),
          versionData.createdAt,
          versionData.didRun,
          versionData.previousVersionID,
          getID(versionData)
        )
      )
    }
  }
}

const IsPromptVersion = (version: { items: ChainItemWithInputs[] | null }) => !version.items

const isVersionDataCompatible = (
  versionData: any,
  prompts: Prompts | null,
  config: PromptConfig | null,
  items: ChainItemWithInputs[] | null
) =>
  IsPromptVersion({ items })
    ? prompts &&
      config &&
      PromptVersionsAreEqual(
        { prompts: versionData.prompts, config: JSON.parse(versionData.config) },
        { prompts, config }
      )
    : items && ChainVersionsAreEqual({ items: JSON.parse(versionData.items) }, { items })

const getVerifiedUserVersionData = async (userID: number, versionID: number) => {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  if (!versionData) {
    throw new Error(`Version with ID ${versionID} does not exist or user has no access`)
  }
  if (IsPromptVersion(versionData)) {
    await ensurePromptAccess(userID, versionData.parentID)
  } else {
    await ensureChainAccess(userID, versionData.parentID)
  }
  return versionData
}

export async function getTrustedVersion(versionID: number, markAsRun = false) {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  if (markAsRun && !versionData.didRun) {
    await updateVersion({ ...versionData, didRun: true })
  }
  return toVersion(versionData, [], [])
}

const DefaultPrompts = { main: '' }

export async function addInitialVersion(userID: number, parentID: number, isChainVersion: boolean) {
  const versionID = await allocateID(Entity.VERSION)
  return toVersionData(
    userID,
    parentID,
    isChainVersion ? null : DefaultPrompts,
    isChainVersion ? null : DefaultConfig,
    isChainVersion ? [] : null,
    [],
    new Date(),
    false,
    undefined,
    versionID
  )
}

export async function savePromptVersionForUser(
  userID: number,
  promptID: number,
  prompts: Prompts = DefaultPrompts,
  config: PromptConfig = DefaultConfig,
  currentVersionID?: number,
  previousVersionID?: number
) {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  return saveVersionForUser(userID, promptData, prompts, config, null, currentVersionID, previousVersionID)
}

export async function saveChainVersionForUser(
  userID: number,
  chainID: number,
  items: ChainItemWithInputs[] = [],
  currentVersionID?: number,
  previousVersionID?: number
) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  return saveVersionForUser(userID, chainData, null, null, items, currentVersionID, previousVersionID)
}

async function saveVersionForUser(
  userID: number,
  parentData: any,
  prompts: Prompts | null,
  config: PromptConfig | null,
  items: ChainItemWithInputs[] | null,
  currentVersionID?: number,
  previousVersionID?: number
) {
  const datastore = getDatastore()

  let currentVersion = currentVersionID ? await getKeyedEntity(Entity.VERSION, currentVersionID) : undefined
  const isCompatible = currentVersionID && isVersionDataCompatible(currentVersion, prompts, config, items)
  const canOverwrite = currentVersionID && (isCompatible || !currentVersion.didRun)

  const versionID = canOverwrite ? currentVersionID : undefined
  if (canOverwrite && previousVersionID === currentVersionID) {
    previousVersionID = currentVersion.previousVersionID
  }
  const didRun = canOverwrite ? currentVersion.didRun : false
  const labels = canOverwrite ? JSON.parse(currentVersion.labels) : []

  const versionData = toVersionData(
    userID,
    getID(parentData),
    prompts,
    config,
    items,
    labels,
    new Date(),
    didRun,
    previousVersionID,
    versionID
  )
  await datastore.save(versionData)
  const savedVersionID = getID(versionData)

  if (IsPromptVersion({ items }) && prompts !== null) {
    const lastPrompt = currentVersion ? JSON.parse(currentVersion.prompts).main : ''
    await augmentPromptDataWithNewVersion(parentData, prompts.main, lastPrompt)
    await augmentProjectWithNewVersion(parentData.projectID, prompts.main, lastPrompt)
  } else if (items) {
    await augmentChainDataWithNewVersion(parentData, savedVersionID, items)
  }

  return savedVersionID
}

async function updateVersion(versionData: any) {
  await getDatastore().save(
    toVersionData(
      versionData.userID,
      versionData.parentID,
      versionData.prompts ? JSON.parse(versionData.prompts) : null,
      versionData.config ? JSON.parse(versionData.config) : null,
      versionData.items ? JSON.parse(versionData.items) : null,
      JSON.parse(versionData.labels),
      versionData.createdAt,
      versionData.didRun,
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

const filterOutEmptyOptionalPrompts = (prompts: Prompts) =>
  Object.fromEntries(Object.entries(prompts).filter(([key, value]) => key === 'main' || value?.trim()?.length))

const toVersionData = (
  userID: number,
  parentID: number,
  prompts: Prompts | null,
  config: PromptConfig | null,
  items: ChainItemWithInputs[] | null,
  labels: string[],
  createdAt: Date,
  didRun: boolean,
  previousVersionID?: number,
  versionID?: number
) => ({
  key: buildKey(Entity.VERSION, versionID),
  data: {
    userID,
    parentID,
    prompts: prompts ? JSON.stringify(filterOutEmptyOptionalPrompts(prompts)) : null,
    config: config ? JSON.stringify(config) : null,
    items: items ? JSON.stringify(items) : null,
    labels: JSON.stringify(labels),
    createdAt,
    didRun,
    previousVersionID,
  },
  excludeFromIndexes: ['prompts', 'config', 'items', 'labels'],
})

export const toUserVersions = (userID: number, versions: any[], runs: any[], comments: any[]) => {
  const userVersion = versions.filter(version => version.userID === userID && !version.didRun).slice(0, 1)
  const versionsWithRuns = versions.filter(version => version.didRun)
  const initialVersion = !versionsWithRuns.length && !userVersion.length ? [versions[0]] : []

  return [...userVersion, ...versionsWithRuns, ...initialVersion]
    .map(version => toVersion(version, runs, comments))
    .reverse()
}

const toVersion = (data: any, runs: any[], comments: any[]): RawPromptVersion | RawChainVersion => ({
  id: getID(data),
  parentID: data.parentID,
  userID: data.userID,
  previousID: data.previousVersionID ?? null,
  timestamp: getTimestamp(data),
  prompts: data.prompts ? JSON.parse(data.prompts) : null,
  config: data.config ? JSON.parse(data.config) : null,
  items: data.items ? JSON.parse(data.items) : null,
  labels: JSON.parse(data.labels),
  didRun: data.didRun,
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
  const wasPromptVersion = IsPromptVersion(versionData)

  const runKeys = await getEntityKeys(Entity.RUN, 'versionID', versionID)
  const commentKeys = await getEntityKeys(Entity.COMMENT, 'versionID', versionID)
  const cacheKeys = await getEntityKeys(Entity.CACHE, 'versionID', versionID)
  await getDatastore().delete([...cacheKeys, ...commentKeys, ...runKeys, buildKey(Entity.VERSION, versionID)])

  if (wasLastVersion) {
    if (wasPromptVersion) {
      await savePromptVersionForUser(userID, parentID)
    } else {
      await saveChainVersionForUser(userID, parentID)
    }
  }

  if (wasPromptVersion) {
    await updatePromptOnDeletedVersion(parentID)
  } else {
    await updateChainOnDeletedVersion(parentID, versionID)
  }
}
