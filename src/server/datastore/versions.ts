import { ChainItemWithInputs, PromptConfig, Prompts, RawChainVersion, RawPromptVersion } from '@/types'
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
  const datastore = getDatastore()
  const [allVersions] = await datastore.runQuery(datastore.createQuery(Entity.VERSION))
  for (const versionData of allVersions) {
    if (postMerge) {
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
    } else {
      let didRun = versionData.didRun
      if (didRun === undefined) {
        const anyRun = await getEntity(Entity.RUN, 'versionID', getID(versionData))
        didRun = !!anyRun
      }
      let prompts = versionData.prompts
      if (prompts === undefined && versionData.prompt !== null && versionData.items === null) {
        prompts = JSON.stringify({ main: versionData.prompt })
      }
      await datastore.save(
        toVersionData(
          versionData.userID,
          versionData.parentID,
          prompts ? JSON.parse(prompts) : null,
          versionData.config ? JSON.parse(versionData.config) : null,
          versionData.items ? JSON.parse(versionData.items) : null,
          JSON.parse(versionData.labels),
          versionData.createdAt,
          didRun,
          versionData.previousVersionID,
          getID(versionData),
          versionData.prompt
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

export async function savePromptVersionForUser(
  userID: number,
  promptID: number,
  prompts: Prompts = { main: '' },
  config: PromptConfig = DefaultConfig,
  currentVersionID?: number
) {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  return saveVersionForUser(userID, promptData, prompts, config, null, currentVersionID)
}

export async function saveChainVersionForUser(
  userID: number,
  chainID: number,
  items: ChainItemWithInputs[] = [],
  currentVersionID?: number
) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  return saveVersionForUser(userID, chainData, null, null, items, currentVersionID)
}

async function saveVersionForUser(
  userID: number,
  parentData: any,
  prompts: Prompts | null,
  config: PromptConfig | null,
  items: ChainItemWithInputs[] | null,
  currentVersionID?: number
) {
  const datastore = getDatastore()

  let currentVersion = currentVersionID ? await getKeyedEntity(Entity.VERSION, currentVersionID) : undefined
  const isCompatible = currentVersionID && isVersionDataCompatible(currentVersion, prompts, config, items)
  const canOverwrite = currentVersionID && (isCompatible || !currentVersion.didRun)

  if (canOverwrite && !isCompatible) {
    const previousVersion = currentVersion.previousVersionID
      ? await getKeyedEntity(Entity.VERSION, currentVersion.previousVersionID)
      : undefined
    if (previousVersion && isVersionDataCompatible(previousVersion, prompts, config, items)) {
      await datastore.delete(buildKey(Entity.VERSION, currentVersionID))
      currentVersionID = currentVersion.previousVersionID
      currentVersion = previousVersion
    }
  }

  const versionID = canOverwrite ? currentVersionID : undefined
  const previousVersionID = canOverwrite ? currentVersion.previousVersionID : currentVersionID
  const didRun = canOverwrite ? currentVersion.didRun : false
  const labels = currentVersion ? JSON.parse(currentVersion.labels) : []

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
    versionID,
    prompts ? prompts.main : undefined
  )
  await datastore.save(versionData)
  const savedVersionID = getID(versionData)

  if (IsPromptVersion({ items }) && prompts !== null) {
    const lastPrompt = currentVersion ? currentVersion.prompts.main : ''
    await augmentPromptDataWithNewVersion(parentData, savedVersionID, prompts.main, lastPrompt)
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
      getID(versionData),
      versionData.prompt
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
  versionID?: number,
  prompt?: string // TODO safe to delete this after running next post-merge data migrations in prod
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
    prompt,
  },
  excludeFromIndexes: ['prompts', 'config', 'items', 'labels', 'prompt'], // TODO delete prompt here too
})

export const toVersion = (data: any, runs: any[], comments: any[]): RawPromptVersion | RawChainVersion => ({
  id: getID(data),
  parentID: data.parentID,
  userID: data.userID,
  previousID: data.previousVersionID ?? null,
  timestamp: getTimestamp(data),
  prompts: data.prompts ? JSON.parse(data.prompts) : null,
  config: data.config ? JSON.parse(data.config) : null,
  items: data.items ? JSON.parse(data.items) : null,
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

  const lastVersionData = await getEntity(Entity.VERSION, 'parentID', parentID, true)

  if (wasPromptVersion) {
    await updatePromptOnDeletedVersion(parentID, getID(lastVersionData))
  } else {
    await updateChainOnDeletedVersion(parentID, versionID, getID(lastVersionData))
  }
}
