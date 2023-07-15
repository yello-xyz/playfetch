import { createHash } from 'crypto'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getEntityKeys,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
} from './datastore'
import { ActiveProject, Project, User } from '@/types'
import { CheckValidURLPath } from '@/src/common/formatting'
import ShortUniqueId from 'short-unique-id'
import { getProjectsIDsForUser, getUserIDsForProject, grantUserAccess, hasUserAccess, revokeUserAccess } from './access'
import { deletePromptForUser, loadEndpoints, toPrompt } from './prompts'
import { getUserForEmail, toUser } from './users'
import { getProjectInputValues } from './inputs'
import { DefaultEndpointFlavor } from './endpoints'

export async function migrateProjects() {
  const datastore = getDatastore()
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  for (const projectData of allProjects) {
    await updateProject({ ...projectData })
  }
}

const hashAPIKey = (apiKey: string) => createHash('sha256').update(apiKey).digest('hex')

const toProjectData = (
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

const toProject = (data: any): Project => ({
  id: getID(data),
  name: data.name,
})

export async function getProjectUsers(projectID: number): Promise<User[]> {
  const userIDs = await getUserIDsForProject(projectID)
  const users = await getKeyedEntities(Entity.USER, userIDs)
  return users.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(toUser)
}

export async function getActiveProject(
  userID: number,
  projectID: number,
  buildURL: (path: string) => string
): Promise<ActiveProject> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const promptData = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID, ['lastEditedAt'])
  const prompts = promptData.map(prompt => toPrompt(prompt, userID))
  const users = await getProjectUsers(projectID)

  return {
    ...toProject(projectData),
    inputs: await getProjectInputValues(projectID),
    projectURLPath: projectData.urlPath,
    availableFlavors: JSON.parse(projectData.flavors),
    endpoints: await loadEndpoints(projectID, projectData, buildURL),
    prompts: [...prompts.filter(prompt => prompt.favorited), ...prompts.filter(prompt => !prompt.favorited)],
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

export async function addProjectForUser(userID: number, projectName: string, isUserProject = false) {
  const urlPath = await getUniqueURLPathFromProjectName(projectName)
  const projectData = toProjectData(
    isUserProject ? 'Prompts' : projectName,
    urlPath,
    [],
    [DefaultEndpointFlavor],
    new Date(),
    undefined,
    undefined,
    isUserProject ? userID : undefined
  )
  await getDatastore().save(projectData)
  const projectID = getID(projectData)
  await grantUserAccess(userID, projectID)
  return projectID
}

export async function inviteMembersToProject(userID: number, projectID: number, emails: string[]) {
  await getVerifiedUserProjectData(userID, projectID)
  for (const email of emails) {
    const user = await getUserForEmail(email.toLowerCase())
    if (user) {
      await grantUserAccess(user.id, projectID)
      // TODO send notification
    } else {
      // TODO send invite to sign up
    }
  }
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
  const hasAccess = await hasUserAccess(userID, projectID)
  if (!hasAccess) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
}

const getVerifiedUserProjectData = async (userID: number, projectID: number) => {
  const hasAccess = await hasUserAccess(userID, projectID)
  if (!hasAccess) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  return getKeyedEntity(Entity.PROJECT, projectID)
}

export async function updateProjectName(userID: number, projectID: number, name: string) {
  if (projectID === userID) {
    throw new Error('Cannot rename user project')
  }
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

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const projectIDs = await getProjectsIDsForUser(userID)
  const projects = await getKeyedEntities(Entity.PROJECT, projectIDs)
  return projects.sort((a, b) => b.createdAt - a.createdAt).map(toProject)
}

export async function deleteProjectForUser(userID: number, projectID: number) {
  // TODO warn or even refuse when project has published endpoints
  await ensureProjectAccess(userID, projectID)
  if (projectID === userID) {
    throw new Error('Cannot delete user project')
  }
  const accessKeys = await getEntityKeys(Entity.ACCESS, 'projectID', projectID)
  if (accessKeys.length > 1) {
    throw new Error('Cannot delete multi-user project')
  }
  const promptKeys = await getEntityKeys(Entity.PROMPT, 'projectID', projectID)
  for (const key of promptKeys) {
    await deletePromptForUser(userID, getID({ key }))
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
