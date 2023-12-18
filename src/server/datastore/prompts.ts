import {
  Entity,
  allocateID,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getEntityKey,
  getEntityKeys,
  getFilteredEntities,
  getFilteredEntity,
  getID,
  getKeyedEntity,
  getLastEntity,
  getOrderedEntities,
} from './datastore'
import {
  addInitialVersion,
  isPromptVersionDataCompatible,
  markVersionAsRun,
  savePromptVersionForUser,
  toUserVersions,
} from './versions'
import { InputValues, Prompt, PromptConfig, Prompts, RawPromptVersion } from '@/types'
import { ensureProjectAccess, updateProjectLastEditedAt } from './projects'
import { StripVariableSentinels } from '@/src/common/formatting'
import { getTrustedParentInputValues } from './inputs'
import { getOrderedRunsForParentID } from './runs'
import { canSuggestImprovedPrompt } from './ratings'
import { PropertyFilter, and } from '@google-cloud/datastore'

export async function migratePrompts(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await updatePrompt({ ...promptData }, false)
  }
}

const toPromptData = (
  projectID: number,
  name: string,
  createdAt: Date,
  lastEditedAt: Date,
  sourcePath: string | undefined,
  promptID: number
) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { projectID, name, createdAt, lastEditedAt, sourcePath },
  excludeFromIndexes: ['name'],
})

export const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  projectID: data.projectID,
  sourcePath: data.sourcePath ?? null,
})

export async function getPromptForUser(
  userID: number,
  promptID: number
): Promise<{
  prompt: Prompt
  versions: RawPromptVersion[]
  inputValues: InputValues
  canSuggestImprovements: boolean
}> {
  const promptData = await getVerifiedUserPromptData(userID, promptID)

  const versions = await getOrderedEntities(Entity.VERSION, 'parentID', promptID)
  const runs = await getOrderedRunsForParentID(promptID)

  const inputValues = await getTrustedParentInputValues(promptID)
  const canSuggestImprovements = await canSuggestImprovedPrompt(promptID)

  return {
    prompt: toPrompt(promptData),
    versions: toUserVersions(userID, versions, runs) as RawPromptVersion[],
    inputValues,
    canSuggestImprovements,
  }
}

export const getUniqueNameWithFormat = async (
  name: string,
  nameExists: (name: string) => Promise<boolean> | boolean,
  format: (name: string, suffix: number) => string
) => {
  let uniqueName = name
  let counter = 2
  while (await nameExists(uniqueName)) {
    uniqueName = format(name, counter++)
  }
  return uniqueName
}

export const getUniqueName = (name: string, existingNames: string[]) =>
  getUniqueNameWithFormat(
    name,
    name => existingNames.includes(name),
    (name, counter) => `${name} ${counter}`
  )

export const matchesDefaultName = (name: string, defaultName: string) =>
  name.match(new RegExp(`^${defaultName}( \\d+)?$`))

const DefaultPromptName = 'New Prompt'

export async function addPromptForUser(
  userID: number,
  projectID: number,
  name = DefaultPromptName,
  sourcePath?: string
) {
  await ensureProjectAccess(userID, projectID)
  const promptNames = await getEntities(Entity.PROMPT, 'projectID', projectID)
  const uniqueName = await getUniqueName(
    name,
    promptNames.map(prompt => prompt.name)
  )
  const [promptData, versionData] = await addPromptToProject(userID, projectID, uniqueName, sourcePath)
  await getDatastore().save([promptData, versionData])
  updateProjectLastEditedAt(projectID)
  return { promptID: getID(promptData), versionID: getID(versionData) }
}

export async function addPromptToProject(
  userID: number,
  projectID: number,
  name = DefaultPromptName,
  sourcePath?: string
) {
  const createdAt = new Date()
  const promptID = await allocateID(Entity.PROMPT)
  const versionData = await addInitialVersion(userID, promptID, false)
  const promptData = toPromptData(projectID, name, createdAt, createdAt, sourcePath, promptID)
  return [promptData, versionData]
}

export async function duplicatePromptForUser(
  userID: number,
  promptID: number,
  targetProjectID?: number
): Promise<number> {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  if (targetProjectID) {
    await ensureProjectAccess(userID, targetProjectID)
  }
  const projectID = targetProjectID ?? promptData.projectID
  const { promptID: newPromptID, versionID } = await addPromptForUser(userID, projectID, promptData.name)
  const versions = await getOrderedEntities(Entity.VERSION, 'parentID', promptID)
  const lastUserVersion = toUserVersions(userID, versions, []).slice(-1)[0] as RawPromptVersion
  await savePromptVersionForUser(userID, newPromptID, lastUserVersion.prompts, lastUserVersion.config, versionID)
  return newPromptID
}

export async function importPromptToProject(
  userID: number,
  projectID: number,
  sourcePath: string,
  prompts: Prompts,
  config: PromptConfig
) {
  const fileName = sourcePath.split('/').slice(-1)[0]
  const promptName = fileName.split('.')[0]
  const previousPromptData = await getFilteredEntity(
    Entity.PROMPT,
    and([buildFilter('projectID', projectID), buildFilter('sourcePath', sourcePath)])
  )
  let newVersionID: number
  if (previousPromptData) {
    const promptID = getID(previousPromptData)
    const versions = await getOrderedEntities(Entity.VERSION, 'parentID', promptID)
    const previousVersion = versions.find(versionData => isPromptVersionDataCompatible(versionData, prompts, config))
    if (previousVersion) {
      newVersionID = getID(previousVersion)
    } else {
      const lastUserVersion = toUserVersions(userID, versions, []).slice(-1)[0] as RawPromptVersion
      const versionID = lastUserVersion.id
      newVersionID = await savePromptVersionForUser(userID, promptID, prompts, config, versionID, versionID)
    }
  } else {
    const { promptID: newPromptID, versionID } = await addPromptForUser(userID, projectID, promptName, sourcePath)
    newVersionID = await savePromptVersionForUser(userID, newPromptID, prompts, config, versionID)
  }
  await markVersionAsRun(newVersionID)
}

export async function getExportablePromptsFromProject(projectID: number) {
  const exportablePrompts: { sourcePath: string; prompts: Prompts; config: PromptConfig }[] = []

  const sourcePathPrompts = await getFilteredEntities(
    Entity.PROMPT,
    and([buildFilter('projectID', projectID), new PropertyFilter('sourcePath', '!=', null)])
  )
  for (const promptData of sourcePathPrompts) {
    const lastRunVersion = await getLastEntity(
      Entity.VERSION,
      and([buildFilter('parentID', getID(promptData)), buildFilter('didRun', true)])
    )
    if (lastRunVersion) {
      const promptVersion = toUserVersions(0, [lastRunVersion], [])[0] as RawPromptVersion
      exportablePrompts.push({
        sourcePath: promptData.sourcePath,
        prompts: promptVersion.prompts,
        config: promptVersion.config,
      })
    }
  }

  return exportablePrompts
}

export async function updatePromptSourcePath(promptID: number, sourcePath: string) {
  const promptData = await getPromptData(promptID)
  await updatePrompt({ ...promptData, sourcePath }, false)
}

async function updatePrompt(promptData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toPromptData(
      promptData.projectID,
      promptData.name,
      promptData.createdAt,
      updateLastEditedTimestamp ? new Date() : promptData.lastEditedAt,
      promptData.sourcePath,
      getID(promptData)
    )
  )
  if (updateLastEditedTimestamp) {
    updateProjectLastEditedAt(promptData.projectID)
  }
}

export async function augmentPromptDataWithNewVersion(
  promptData: any,
  newVersionPrompt: string,
  previousVersionPrompt: string
) {
  const newPromptName =
    matchesDefaultName(promptData.name, DefaultPromptName) && !previousVersionPrompt.length && newVersionPrompt.length
      ? StripVariableSentinels(newVersionPrompt).split(' ').slice(0, 5).join(' ')
      : promptData.name

  await updatePrompt({ ...promptData, name: newPromptName }, true)
}

const getPromptData = (promptID: number) => getKeyedEntity(Entity.PROMPT, promptID)

export const getTrustedPrompt = (promptID: number) => getPromptData(promptID).then(toPrompt)

export async function updatePromptOnDeletedVersion(promptID: number) {
  // TODO update previous version references in other versions?
  const promptData = await getPromptData(promptID)
  await updatePrompt({ ...promptData }, true)
}

export const getTrustedProjectScopedData = async (entities: Entity[], id: number) => {
  let data
  for (const entity of entities) {
    data = await getKeyedEntity(entity, id)
    if (data) {
      break
    }
  }
  if (!data) {
    throw new Error(`Entity with ID ${id} does not exist or user has no access`)
  }
  return data
}

export const getVerifiedProjectScopedData = async (userID: number, entities: Entity[], id: number) => {
  const data = await getTrustedProjectScopedData(entities, id)
  await ensureProjectAccess(userID, data.projectID)
  return data
}

export const getVerifiedUserPromptData = async (userID: number, promptID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.PROMPT], promptID)

export const ensurePromptAccess = (userID: number, promptID: number) => getVerifiedUserPromptData(userID, promptID)

export async function updatePromptName(userID: number, promptID: number, name: string) {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  await updatePrompt({ ...promptData, name }, true)
}

export async function deletePromptForUser(userID: number, promptID: number) {
  await ensurePromptAccess(userID, promptID)

  const anyEndpointKey = await getEntityKey(Entity.ENDPOINT, 'parentID', promptID)
  if (anyEndpointKey) {
    throw new Error('Cannot delete prompt with published endpoints')
  }

  const versionKeys = await getEntityKeys(Entity.VERSION, 'parentID', promptID)
  const runKeys = await getEntityKeys(Entity.RUN, 'parentID', promptID)
  const commentKeys = await getEntityKeys(Entity.COMMENT, 'parentID', promptID)
  const inputKeys = await getEntityKeys(Entity.INPUT, 'parentID', promptID)
  const cacheKeys = await getEntityKeys(Entity.CACHE, 'parentID', promptID)
  await getDatastore().delete([
    ...cacheKeys,
    ...inputKeys,
    ...commentKeys,
    ...runKeys,
    ...versionKeys,
    buildKey(Entity.PROMPT, promptID),
  ])
}
