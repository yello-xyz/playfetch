import {
  Entity,
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
import { saveVersionForUser, toVersion } from './versions'
import { InputValues, Prompt, RawPromptVersion } from '@/types'
import { ensureProjectAccess, updateProjectLastEditedAt } from './projects'
import { StripPromptSentinels } from '@/src/common/formatting'
import { getTrustedParentInputValues } from './inputs'

export async function migratePrompts() {
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await updatePrompt({ ...promptData }, false)
  }
}

const toPromptData = (
  projectID: number,
  name: string,
  lastVersionID: number,
  createdAt: Date,
  lastEditedAt: Date,
  promptID?: number
) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { projectID, lastVersionID, name, createdAt, lastEditedAt },
  excludeFromIndexes: ['name'],
})

export const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  lastVersionID: data.lastVersionID,
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
    versions: versions.map(version => toVersion(version, runs, comments) as RawPromptVersion).reverse(),
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
  const createdAt = new Date()
  const promptData = toPromptData(projectID, uniqueName, 0, createdAt, createdAt)
  await getDatastore().save(promptData)
  const versionID = await saveVersionForUser(userID, getID(promptData))
  await updateProjectLastEditedAt(projectID)
  return { promptID: getID(promptData), versionID }
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
  const lastVersion = await getKeyedEntity(Entity.VERSION, promptData.lastVersionID)
  await saveVersionForUser(userID, newPromptID, lastVersion.prompt, JSON.parse(lastVersion.config), versionID)
  return newPromptID
}

export async function updatePrompt(promptData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toPromptData(
      promptData.projectID,
      promptData.name,
      promptData.lastVersionID,
      promptData.createdAt,
      updateLastEditedTimestamp ? new Date() : promptData.lastEditedAt,
      getID(promptData)
    )
  )
  if (updateLastEditedTimestamp) {
    await updateProjectLastEditedAt(promptData.projectID)
  }
}

export async function augmentPromptDataWithNewVersion(
  promptData: any,
  newVersionID: number,
  newVersionPrompt: string,
  previousVersionPrompt: string
) {
  const newPromptName =
    matchesDefaultName(promptData.name, DefaultPromptName) && !previousVersionPrompt.length && newVersionPrompt.length
      ? StripPromptSentinels(newVersionPrompt).split(' ').slice(0, 5).join(' ')
      : promptData.name

  await updatePrompt({ ...promptData, lastVersionID: newVersionID, name: newPromptName }, true)
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
  await getDatastore().delete([
    ...inputKeys,
    ...commentKeys,
    ...runKeys,
    ...versionKeys,
    buildKey(Entity.PROMPT, promptID),
  ])
}
