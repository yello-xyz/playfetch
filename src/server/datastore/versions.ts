import { ChainItemWithInputs, PromptConfig, Prompts, RawChainVersion, RawPromptVersion } from '@/types'
import {
  Entity,
  allocateID,
  buildKey,
  getDatastore,
  getEntityKey,
  getEntityKeys,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getRecentEntities,
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
import { saveComment } from './comments'
import { ChainVersionsAreEqual, PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import {
  augmentChainDataWithNewVersion,
  ensureChainAccess,
  getVerifiedUserChainData,
  updateChainOnDeletedVersion,
} from './chains'
import { getDefaultPromptConfigForUser } from './users'

export async function migrateVersions(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  let remainingSaveCount = 100
  const [allVersions] = await datastore.runQuery(datastore.createQuery(Entity.VERSION))
  for (const versionData of allVersions) {
    if (remainingSaveCount-- <= 0) {
      console.log('‼️  Please run this migration again to process remaining versions')
      return
    }
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
  console.log('✅ Processed all remaining versions')
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
  return toVersion(versionData, [])
}

const DefaultPrompts = { main: '' }

export async function addInitialVersion(userID: number, parentID: number, isChainVersion: boolean) {
  const versionID = await allocateID(Entity.VERSION)
  const promptConfig = isChainVersion ? null : await getDefaultPromptConfigForUser(userID)
  return toVersionData(
    userID,
    parentID,
    isChainVersion ? null : DefaultPrompts,
    promptConfig,
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
  prompts: Prompts,
  config: PromptConfig,
  currentVersionID?: number,
  previousVersionID?: number
) {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  return saveVersionForUser(userID, promptData, prompts, config, null, currentVersionID, previousVersionID)
}

export async function saveChainVersionForUser(
  userID: number,
  chainID: number,
  items: ChainItemWithInputs[],
  currentVersionID?: number,
  previousVersionID?: number
) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  markVersionsAsRun([
    ...new Set(items.flatMap(item => ('versionID' in item && item.versionID ? [item.versionID] : []))),
  ])
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

async function markVersionsAsRun(versionIDs: number[]) {
  const versionsData = await getKeyedEntities(Entity.VERSION, versionIDs)
  const notRunVersions = versionsData.filter(versionData => !versionData.didRun)
  if (notRunVersions.length > 0) {
    await getDatastore().save(notRunVersions.map(versionData => updateVersionData({ ...versionData, didRun: true })))
  }
}

const updateVersionData = (versionData: any) =>
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

const updateVersion = (versionData: any) => getDatastore().save(updateVersionData(versionData))

export async function processLabels(
  labels: string[],
  userID: number,
  versionID: number,
  parentID: number,
  projectID: number,
  label: string,
  checked: boolean,
  replyTo?: number,
  runID?: number
) {
  if (checked !== labels.includes(label)) {
    const newLabels = checked ? [...labels, label] : labels.filter(l => l !== label)
    if (checked) {
      await ensureProjectLabel(userID, projectID, label)
    }
    await saveComment(
      userID,
      projectID,
      parentID,
      versionID,
      label,
      replyTo,
      checked ? 'addLabel' : 'removeLabel',
      runID
    )
    return newLabels
  }
  return undefined
}

export async function updateVersionLabel(
  userID: number,
  versionID: number,
  projectID: number,
  label: string,
  checked: boolean,
  replyTo?: number
) {
  const versionData = await getVerifiedUserVersionData(userID, versionID)
  const labels = JSON.parse(versionData.labels) as string[]
  const newLabels = await processLabels(
    labels,
    userID,
    versionID,
    versionData.parentID,
    projectID,
    label,
    checked,
    replyTo
  )
  if (newLabels) {
    await updateVersion({ ...versionData, labels: JSON.stringify(newLabels), didRun: true })
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

export const toUserVersions = (userID: number, versions: any[], runs: any[]) => {
  const pendingUserVersions = versions.filter(version => version.userID === userID && !version.didRun)
  if (pendingUserVersions.length > 1) {
    console.error(`‼️ found ${pendingUserVersions.length} pending versions for user ${userID}`)
  }

  const userVersion = pendingUserVersions.slice(0, 1)
  const versionsWithRuns = versions.filter(version => version.didRun)
  const initialVersion = !versionsWithRuns.length && !userVersion.length ? [versions.slice(-1)[0]] : []

  return [...userVersion, ...versionsWithRuns, ...initialVersion].map(version => toVersion(version, runs)).reverse()
}

const toVersion = (data: any, runs: any[]): RawPromptVersion | RawChainVersion => ({
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
})

export async function deleteVersionForUser(userID: number, versionID: number) {
  const versionData = await getVerifiedUserVersionData(userID, versionID)

  const anyEndpointKey = await getEntityKey(Entity.ENDPOINT, 'versionID', versionID)
  if (anyEndpointKey) {
    throw new Error('Cannot delete version with published endpoints')
  }

  const parentID = versionData.parentID
  const wasPromptVersion = IsPromptVersion(versionData)

  const runKeys = await getEntityKeys(Entity.RUN, 'versionID', versionID)
  const commentKeys = await getEntityKeys(Entity.COMMENT, 'versionID', versionID)
  const cacheKeys = await getEntityKeys(Entity.CACHE, 'versionID', versionID)
  await getDatastore().delete([...cacheKeys, ...commentKeys, ...runKeys, buildKey(Entity.VERSION, versionID)])

  const anyVersionWithSameParentKey = await getEntityKey(Entity.VERSION, 'parentID', parentID)
  if (!anyVersionWithSameParentKey) {
    if (wasPromptVersion) {
      const promptConfig = await getDefaultPromptConfigForUser(userID)
      await savePromptVersionForUser(userID, parentID, DefaultPrompts, promptConfig)
    } else {
      await saveChainVersionForUser(userID, parentID, [])
    }
  }

  if (wasPromptVersion) {
    await updatePromptOnDeletedVersion(parentID)
  } else {
    await updateChainOnDeletedVersion(parentID, versionID)
  }
}

export async function getRecentVersions(
  before: Date | undefined,
  limit: number
): Promise<(RawPromptVersion | RawChainVersion)[]> {
  const recentVersionsData = await getRecentEntities(Entity.VERSION, limit, undefined, before)
  return recentVersionsData.map(data => toVersion(data, []))
}
