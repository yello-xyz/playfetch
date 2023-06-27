import { createHash } from 'crypto'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
  toID,
} from './datastore'
import { ActiveProject, Project, User } from '@/types'
import { CheckValidURLPath } from '@/common/formatting'
import ShortUniqueId from 'short-unique-id'
import { getProjectsIDsForUser, getUserIDsForProject, grantUserAccess, hasUserAccess } from './access'
import { toPrompt } from './prompts'
import { getUserForEmail, toUser } from './users'

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
  createdAt: Date,
  apiKeyHash?: string,
  projectID?: number
) => ({
  key: buildKey(Entity.PROJECT, projectID),
  data: { name, createdAt, labels: JSON.stringify(labels), urlPath, apiKeyHash },
  excludeFromIndexes: ['name', 'apiKeyHash', 'labels'],
})

const toProject = (data: any): Project => ({
  id: getID(data),
  name: data.name,
  urlPath: data.urlPath,
  labels: JSON.parse(data.labels),
})

const toUserProject = (userID: number): Project => ({
  id: userID,
  name: 'Prompts',
  urlPath: '',
  labels: [],
})

export async function getProjectUsers(userID: number, projectID: number): Promise<User[]> {
  const userIDs = projectID === userID ? [userID] : await getUserIDsForProject(projectID)
  const users = await getKeyedEntities(Entity.USER, userIDs)
  return users.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(toUser)
}

export async function getActiveProject(userID: number, projectID: number): Promise<ActiveProject> {
  const projectData = projectID === userID ? undefined : await getVerifiedUserProjectData(userID, projectID)
  const prompts = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID, ['favorited', 'lastEditedAt'])
  const users = await getProjectUsers(userID, projectID)

  return {
    ...(projectData ? toProject(projectData) : toUserProject(userID)),
    prompts: prompts.map(promptData => toPrompt(promptData)),
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

export async function addProjectForUser(userID: number, projectName: string) {
  const urlPath = await getUniqueURLPathFromProjectName(projectName)
  const projectData = toProjectData(projectName, urlPath, [], new Date())
  await getDatastore().save(projectData)
  const projectID = toID(projectData)
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

export async function checkProject(urlPath: string, apiKey?: string): Promise<boolean> {
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
      projectData.createdAt,
      projectData.apiKeyHash,
      getID(projectData)
    )
  )
}

const getVerifiedUserProjectData = async (userID: number, projectID: number) => {
  const hasAccess = await hasUserAccess(userID, projectID)
  if (!hasAccess) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  return getKeyedEntity(Entity.PROJECT, projectID)
}

export async function ensureProjectLabels(userID: number, projectID: number, labels: string[]) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const oldLabels = JSON.parse(projectData.labels)
  const newLabels = [...oldLabels, ...labels.filter(label => !oldLabels.includes(label))]
  await updateProject({ ...projectData, labels: JSON.stringify(newLabels) })
}

export async function rotateProjectAPIKey(userID: number, projectID: number): Promise<string> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const apiKey = `sk-${new ShortUniqueId({ length: 48, dictionary: 'alphanum' })()}`
  const apiKeyHash = hashAPIKey(apiKey)
  await updateProject({ ...projectData, apiKeyHash })
  return apiKey
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const projectIDs = await getProjectsIDsForUser(userID)
  const projects = await getKeyedEntities(Entity.PROJECT, projectIDs)
  return [toUserProject(userID), ...projects.sort((a, b) => b.createdAt - a.createdAt).map(toProject)]
}
