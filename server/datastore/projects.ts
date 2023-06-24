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
  getTimestamp,
  toID,
} from './datastore'
import { ActiveProject, Project } from '@/types'
import { CheckValidURLPath, ProjectNameToURLPath } from '@/common/formatting'
import ShortUniqueId from 'short-unique-id'
import { getProjectsIDsForUser, getUserIDsForProject, grantUserAccess, hasUserAccess } from './access'
import { toPrompt } from './prompts'
import { toUser } from './users'

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
  timestamp: getTimestamp(data),
})

export async function getProjectWithPrompts(userID: number, projectID: number | null): Promise<ActiveProject> {
  const getOrderedPrompts = (projectID: number) =>
    getOrderedEntities(Entity.PROMPT, 'projectID', projectID, ['favorited', 'lastEditedAt'])

  if (projectID) {
    const projectData = await getVerifiedUserProjectData(userID, projectID)
    const prompts = await getOrderedPrompts(projectID)
    const userIDs = await getUserIDsForProject(projectID)
    const users = await getKeyedEntities(Entity.USER, userIDs)

    return {
      ...toProject(projectData),
      prompts: prompts.map(promptData => toPrompt(userID, promptData)),
      users: users.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(toUser),
    }
  } else {
    const prompts = await getOrderedPrompts(userID)
    return {
      id: null,
      prompts: prompts.map(promptData => toPrompt(userID, promptData)),
    }
  }
}

export async function addProjectForUser(userID: number, projectName: string) {
  const urlPath = ProjectNameToURLPath(projectName)
  if (!CheckValidURLPath(urlPath)) {
    throw new Error(`URL path '${urlPath}' is invalid`)
  }
  if (await checkProject(urlPath)) {
    throw new Error(`URL path '${urlPath}' already exists`)
  }
  const projectData = toProjectData(projectName, urlPath, [], new Date())
  const projectID = toID(projectData)
  await getDatastore().save(projectData)
  await grantUserAccess(userID, projectID)
  return projectID
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
  return projects.sort((a, b) => b.createdAt - a.createdAt).map(toProject)
}
