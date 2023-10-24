import {
  Entity,
  allocateID,
  buildKey,
  getDatastore,
  getEntities,
  getEntityKey,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
} from './datastore'
import { addInitialVersion, savePromptVersionForUser, toUserVersions } from './versions'
import { InputValues, Prompt, RawPromptVersion } from '@/types'
import { ensureProjectAccess, updateProjectLastEditedAt } from './projects'
import { StripVariableSentinels } from '@/src/common/formatting'
import { getTrustedParentInputValues } from './inputs'

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

const toPromptData = (projectID: number, name: string, createdAt: Date, lastEditedAt: Date, promptID: number) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { projectID, name, createdAt, lastEditedAt },
  excludeFromIndexes: ['name'],
})

export const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt'),
})

export async function getPromptForUser(
  userID: number,
  promptID: number
): Promise<{ prompt: Prompt; versions: RawPromptVersion[]; inputValues: InputValues }> {
  const promptData = await getVerifiedUserPromptData(userID, promptID)

  const versions = await getOrderedEntities(Entity.VERSION, 'parentID', promptID)
  const runs = await getOrderedEntities(Entity.RUN, 'parentID', promptID)
  const comments = await getOrderedEntities(Entity.COMMENT, 'parentID', promptID)

  const inputValues = await getTrustedParentInputValues(promptID)

  return {
    prompt: toPrompt(promptData),
    versions: toUserVersions(userID, versions, runs, comments) as RawPromptVersion[],
    inputValues,
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

export async function addPromptForUser(userID: number, projectID: number, name = DefaultPromptName) {
  await ensureProjectAccess(userID, projectID)
  const promptNames = await getEntities(Entity.PROMPT, 'projectID', projectID)
  const uniqueName = await getUniqueName(
    name,
    promptNames.map(prompt => prompt.name)
  )
  const [promptData, versionData] = await addFirstProjectPrompt(userID, projectID, uniqueName)
  await getDatastore().save([promptData, versionData])
  updateProjectLastEditedAt(projectID)
  return { promptID: getID(promptData), versionID: getID(versionData) }
}

export async function addFirstProjectPrompt(userID: number, projectID: number, name = DefaultPromptName) {
  const createdAt = new Date()
  const promptID = await allocateID(Entity.PROMPT)
  const versionData = await addInitialVersion(userID, promptID, false)
  const promptData = toPromptData(projectID, name, createdAt, createdAt, promptID)
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
  const lastUserVersion = toUserVersions(userID, versions, [], []).slice(-1)[0] as RawPromptVersion
  await savePromptVersionForUser(userID, newPromptID, lastUserVersion.prompts, lastUserVersion.config, versionID)
  return newPromptID
}

async function updatePrompt(promptData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toPromptData(
      promptData.projectID,
      promptData.name,
      promptData.createdAt,
      updateLastEditedTimestamp ? new Date() : promptData.lastEditedAt,
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

export const getVerifiedProjectScopedData = async (userID: number, entities: Entity[], id: number) => {
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
