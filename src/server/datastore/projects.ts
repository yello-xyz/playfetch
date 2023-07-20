import { createHash } from 'crypto'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getEntityIDs,
  getEntityKeys,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
} from './datastore'
import { ActiveProject, Project, User } from '@/types'
import { CheckValidURLPath } from '@/src/common/formatting'
import ShortUniqueId from 'short-unique-id'
import {
  getAccessibleObjectIDs,
  getAccessingUserIDs,
  grantUsersAccess,
  hasUserAccess,
  revokeUserAccess,
} from './access'
import { addPromptForUser, deletePromptForUser, loadEndpoints, toPrompt } from './prompts'
import { toUser } from './users'
import { getProjectInputValues } from './inputs'
import { DefaultEndpointFlavor } from './endpoints'
import { toChain } from './chains'
import { ensureWorkspaceAccess } from './workspaces'

export async function migrateProjects() {
  const datastore = getDatastore()
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  for (const projectData of allProjects) {
    await updateProject({ ...projectData })
  }
}

const hashAPIKey = (apiKey: string) => createHash('sha256').update(apiKey).digest('hex')

const toProjectData = (
  workspaceID: number,
  name: string,
  urlPath: string,
  labels: string[],
  flavors: string[],
  createdAt: Date,
  apiKeyHash?: string,
  apiKeyDev?: string,
  projectID?: number
) => ({
  key: buildKey(Entity.PROJECT, projectID),
  data: {
    workspaceID,
    name,
    createdAt,
    labels: JSON.stringify(labels),
    flavors: JSON.stringify(flavors),
    urlPath,
    apiKeyHash,
    apiKeyDev, // TODO do NOT store api key in datastore but show it once to user on creation
  },
  excludeFromIndexes: ['name', 'apiKeyHash', 'apiKeyDev', 'labels', 'flavors'],
})

export const toProject = (data: any): Project => ({
  id: getID(data),
  name: data.name,
  workspaceID: data.workspaceID,
})

async function getProjectAndWorkspaceUsers(projectID: number, workspaceID: number): Promise<User[]> {
  const projectUserIDs = await getAccessingUserIDs(projectID, 'project')
  const workspaceUserIDs = await getAccessingUserIDs(workspaceID, 'workspace')
  const users = await getKeyedEntities(Entity.USER, [...new Set([...projectUserIDs, ...workspaceUserIDs])])
  return users.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(toUser)
}

export async function getProjectUsers(projectID: number): Promise<User[]> {
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  return getProjectAndWorkspaceUsers(projectID, projectData.workspaceID)
}

export async function getActiveProject(
  userID: number,
  projectID: number,
  buildURL: (path: string) => string
): Promise<ActiveProject> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const promptData = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID, ['lastEditedAt'])
  const prompts = promptData.map(prompt => toPrompt(prompt, userID))
  const chainData = await getOrderedEntities(Entity.CHAIN, 'projectID', projectID, ['lastEditedAt'])
  const chains = chainData.map(chain => toChain(chain, userID))
  const users = await getProjectAndWorkspaceUsers(projectID, projectData.workspaceID)

  return {
    ...toProject(projectData),
    inputs: await getProjectInputValues(projectID),
    projectURLPath: projectData.urlPath,
    availableFlavors: JSON.parse(projectData.flavors),
    endpoints: await loadEndpoints(projectID, projectData, buildURL),
    prompts: [...prompts.filter(prompt => prompt.favorited), ...prompts.filter(prompt => !prompt.favorited)],
    chains: [...chains.filter(chain => chain.favorited), ...chains.filter(chain => !chain.favorited)],
    users,
  }
}

const getUniqueURLPathFromProjectName = async (projectName: string) => {
  let urlPath = projectName
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9\-]/gim, '')
  if (!CheckValidURLPath(urlPath)) {
    urlPath = `project-${urlPath}`
  }
  let uniqueURLPath = urlPath
  let counter = 2
  while (await checkProject(uniqueURLPath)) {
    uniqueURLPath = `${urlPath}-${counter++}`
  }
  return uniqueURLPath
}

export async function addProjectForUser(userID: number, workspaceID: number, projectName: string) {
  await ensureWorkspaceAccess(userID, workspaceID)
  const urlPath = await getUniqueURLPathFromProjectName(projectName)
  const projectData = toProjectData(workspaceID, projectName, urlPath, [], [DefaultEndpointFlavor], new Date())
  await getDatastore().save(projectData)
  const projectID = getID(projectData)
  await addPromptForUser(userID, projectID)
  return projectID
}

export async function inviteMembersToProject(userID: number, projectID: number, emails: string[]) {
  await getVerifiedUserProjectData(userID, projectID)
  await grantUsersAccess(emails, projectID, 'project')
}

export async function revokeMemberAccessForProject(userID: number, projectID: number) {
  await revokeUserAccess(userID, projectID)
}

export async function checkProject(urlPath: string, apiKey?: string): Promise<number | undefined> {
  const projectData = await getEntity(Entity.PROJECT, 'urlPath', urlPath)
  return projectData && (!apiKey || projectData.apiKeyHash === hashAPIKey(apiKey))
}

export async function getURLPathForProject(userID: number, projectID: number): Promise<string> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  return projectData.urlPath
}

async function updateProject(projectData: any) {
  await getDatastore().save(
    toProjectData(
      projectData.workspaceID,
      projectData.name,
      projectData.urlPath,
      JSON.parse(projectData.labels),
      JSON.parse(projectData.flavors),
      projectData.createdAt,
      projectData.apiKeyHash,
      projectData.apiKeyDev,
      getID(projectData)
    )
  )
}

export async function ensureProjectAccess(userID: number, projectID: number) {
  await getVerifiedUserProjectData(userID, projectID)
}

const getVerifiedUserProjectData = async (userID: number, projectID: number) => {
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  if (!projectData) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  const hasAccess = await hasUserAccess(userID, projectID)
  if (!hasAccess) {
    await ensureWorkspaceAccess(userID, projectData.workspaceID)
  }
  return projectData
}

export async function updateProjectName(userID: number, projectID: number, name: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  await updateProject({ ...projectData, name })
}

export async function addProjectFlavor(userID: number, projectID: number, flavor: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  await updateProject({ ...projectData, flavors: JSON.stringify([...JSON.parse(projectData.flavors), flavor]) })
}

export async function ensureProjectLabel(userID: number, projectID: number, label: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const labels = JSON.parse(projectData.labels)
  if (!labels.includes(label)) {
    const newLabels = [...labels, label]
    await updateProject({ ...projectData, labels: JSON.stringify(newLabels) })
  }
}

export async function ensureProjectAPIKey(userID: number, projectID: number): Promise<string> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  return projectData.apiKeyDev ?? rotateProjectAPIKey(projectData)
}

async function rotateProjectAPIKey(projectData: any): Promise<string> {
  const apiKey = `sk-${new ShortUniqueId({ length: 48, dictionary: 'alphanum' })()}`
  const apiKeyHash = hashAPIKey(apiKey)
  await updateProject({ ...projectData, apiKeyHash, apiKeyDev: apiKey })
  return apiKey
}

export async function getSharedProjectsForUser(userID: number): Promise<Project[]> {
  const projectIDs = await getAccessibleObjectIDs(userID, 'project')
  const projects = await getKeyedEntities(Entity.PROJECT, projectIDs)
  return projects.sort((a, b) => b.createdAt - a.createdAt).map(toProject)
}

export async function deleteProjectForUser(userID: number, projectID: number) {
  // TODO warn or even refuse when project has published endpoints
  await ensureProjectAccess(userID, projectID)
  const accessKeys = await getEntityKeys(Entity.ACCESS, 'objectID', projectID)
  if (accessKeys.length > 1) {
    // TODO this doesn't stop you from deleting a project in a shared workspace that wasn't shared separately.
    throw new Error('Cannot delete multi-user project')
  }
  const promptIDs = await getEntityIDs(Entity.PROMPT, 'projectID', projectID)
  for (const promptID of promptIDs) {
    await deletePromptForUser(userID, promptID)
  }
  const inputKeys = await getEntityKeys(Entity.INPUT, 'projectID', projectID)
  const endpointKeys = await getEntityKeys(Entity.ENDPOINT, 'parentID', projectID)
  const usageKeys = await getEntityKeys(Entity.USAGE, 'parentID', projectID)
  await getDatastore().delete([
    ...accessKeys,
    ...usageKeys,
    ...endpointKeys,
    ...inputKeys,
    buildKey(Entity.PROJECT, projectID),
  ])
}
