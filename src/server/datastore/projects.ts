import { createHash } from 'crypto'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntities,
  getEntity,
  getEntityIDs,
  getEntityKeys,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
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
import { addPromptForUser, deletePromptForUser, toPrompt } from './prompts'
import { toUser } from './users'
import { getProjectInputValues } from './inputs'
import { DefaultEndpointFlavor, toEndpoint } from './endpoints'
import { toChain } from './chains'
import { ensureWorkspaceAccess } from './workspaces'
import { toUsage } from './usage'

export async function migrateProjects() {
  const datastore = getDatastore()
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  for (const projectData of allProjects) {
    await updateProject({ ...projectData }, false)
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
  lastEditedAt: Date,
  favorited: number[],
  apiKeyHash?: string,
  apiKeyDev?: string,
  projectID?: number
) => ({
  key: buildKey(Entity.PROJECT, projectID),
  data: {
    workspaceID,
    name,
    createdAt,
    lastEditedAt,
    labels: JSON.stringify(labels),
    flavors: JSON.stringify(flavors),
    favorited: JSON.stringify(favorited),
    urlPath,
    apiKeyHash,
    apiKeyDev, // TODO do NOT store api key in datastore but show it once to user on creation
  },
  excludeFromIndexes: ['name', 'apiKeyHash', 'apiKeyDev', 'labels', 'flavors'],
})

export const toProject = (data: any, userID: number): Project => ({
  id: getID(data),
  name: data.name,
  workspaceID: data.workspaceID,
  timestamp: getTimestamp(data, 'lastEditedAt'),
  favorited: JSON.parse(data.favorited).includes(userID),
})

async function getProjectAndWorkspaceUsers(projectID: number, workspaceID: number): Promise<User[]> {
  const projectUserIDs = await getAccessingUserIDs(projectID, 'project')
  const workspaceUserIDs = await getAccessingUserIDs(workspaceID, 'workspace')
  const users = await getKeyedEntities(Entity.USER, [...new Set([...projectUserIDs, ...workspaceUserIDs])])
  return users.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(toUser)
}

export async function getProjectUsers(projectID: number): Promise<User[]> {
  const projectData = await getTrustedProjectData(projectID)
  return getProjectAndWorkspaceUsers(projectID, projectData.workspaceID)
}

export async function loadEndpoints(projectData: any, buildURL: (path: string) => string) {
  const endpoints = await getOrderedEntities(Entity.ENDPOINT, 'projectURLPath', projectData.urlPath)
  const usages = await getEntities(Entity.USAGE, 'projectURLPath', projectData.urlPath)

  return endpoints
    .map(endpoint => ({
      ...toEndpoint(endpoint),
      url: buildURL(`/p/${endpoint.projectURLPath}/${endpoint.urlPath}`),
      apiKeyDev: projectData.apiKeyDev ?? '',
      usage: toUsage(usages.find(usage => getID(usage) === getID(endpoint))),
    }))
    .reverse()
}

export async function getActiveProject(
  userID: number,
  projectID: number,
  buildURL: (path: string) => string
): Promise<ActiveProject> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const promptData = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID, ['lastEditedAt'])
  const prompts = promptData.map(toPrompt)
  const chainData = await getOrderedEntities(Entity.CHAIN, 'projectID', projectID, ['lastEditedAt'])
  const chains = chainData.map(toChain)
  const users = await getProjectAndWorkspaceUsers(projectID, projectData.workspaceID)

  return {
    ...toProject(projectData, userID),
    inputValues: await getProjectInputValues(projectID),
    projectURLPath: projectData.urlPath,
    availableFlavors: JSON.parse(projectData.flavors),
    endpoints: await loadEndpoints(projectData, buildURL), 
    prompts,
    chains,
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
  const createdAt = new Date()
  const projectData = toProjectData(
    workspaceID,
    projectName,
    urlPath,
    [],
    [DefaultEndpointFlavor],
    createdAt,
    createdAt,
    []
  )
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

async function updateProject(projectData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toProjectData(
      projectData.workspaceID,
      projectData.name,
      projectData.urlPath,
      JSON.parse(projectData.labels),
      JSON.parse(projectData.flavors),
      projectData.createdAt,
      updateLastEditedTimestamp ? new Date() : projectData.lastEditedAt,
      JSON.parse(projectData.favorited),
      projectData.apiKeyHash,
      projectData.apiKeyDev,
      getID(projectData)
    )
  )
}

export async function ensureProjectAccess(userID: number, projectID: number) {
  await getVerifiedUserProjectData(userID, projectID)
}

const getTrustedProjectData = (projectID: number) => getKeyedEntity(Entity.PROJECT, projectID)

const getVerifiedUserProjectData = async (userID: number, projectID: number) => {
  const projectData = await getTrustedProjectData(projectID)
  if (!projectData) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  const hasAccess = await hasUserAccess(userID, projectID)
  if (!hasAccess) {
    await ensureWorkspaceAccess(userID, projectData.workspaceID)
  }
  return projectData
}

// TODO Also call this when deleting prompts/chains or updating endpoints etc.
export async function updateProjectLastEditedAt(projectID: number) {
  const projectData = await getTrustedProjectData(projectID)
  await updateProject(projectData, true)
}

export async function updateProjectName(userID: number, projectID: number, name: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  await updateProject({ ...projectData, name }, true)
}

export async function addProjectFlavor(userID: number, projectID: number, flavor: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  await updateProject({ ...projectData, flavors: JSON.stringify([...JSON.parse(projectData.flavors), flavor]) }, true)
}

export async function ensureProjectLabel(userID: number, projectID: number, label: string) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const labels = JSON.parse(projectData.labels)
  if (!labels.includes(label)) {
    const newLabels = [...labels, label]
    await updateProject({ ...projectData, labels: JSON.stringify(newLabels) }, true)
  }
}

export async function ensureProjectAPIKey(userID: number, projectID: number): Promise<string> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  return projectData.apiKeyDev ?? rotateProjectAPIKey(projectData)
}

async function rotateProjectAPIKey(projectData: any): Promise<string> {
  const apiKey = `sk-${new ShortUniqueId({ length: 48, dictionary: 'alphanum' })()}`
  const apiKeyHash = hashAPIKey(apiKey)
  await updateProject({ ...projectData, apiKeyHash, apiKeyDev: apiKey }, true)
  return apiKey
}

export async function toggleFavoriteProject(userID: number, projectID: number, favorited: boolean) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const oldFavorited = JSON.parse(projectData.favorited)
  await updateProject(
    {
      ...projectData,
      favorited: JSON.stringify(
        favorited ? [...oldFavorited, userID] : oldFavorited.filter((id: number) => id !== userID)
      ),
    },
    false
  )
}

export async function updateProjectWorkspace(userID: number, projectID: number, workspaceID: number) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  await ensureWorkspaceAccess(userID, workspaceID)
  await updateProject({ ...projectData, workspaceID }, true)
}

export async function getSharedProjectsForUser(userID: number): Promise<Project[]> {
  const projectIDs = await getAccessibleObjectIDs(userID, 'project')
  const projects = await getKeyedEntities(Entity.PROJECT, projectIDs)
  return projects.sort((a, b) => b.lastEditedAt - a.lastEditedAt).map(project => toProject(project, userID))
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
