import { createHash } from 'crypto'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getID,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
  toID,
} from './datastore'
import { Project } from '@/types'
import { CheckValidURLPath, ProjectNameToURLPath } from '@/common/formatting'
import ShortUniqueId from 'short-unique-id'

export async function migrateProjects() {
  const datastore = getDatastore()
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  for (const projectData of allProjects) {
    await updateProject({ ...projectData })
  }
}

const hashAPIKey = (apiKey: string) => createHash('sha256').update(apiKey).digest('hex')

const toProjectData = (
  userID: number,
  name: string,
  urlPath: string,
  labels: string[],
  createdAt: Date,
  apiKeyHash?: string,
  projectID?: number
) => ({
  key: buildKey(Entity.PROJECT, projectID),
  data: { userID, name, createdAt, labels: JSON.stringify(labels), urlPath, apiKeyHash },
  excludeFromIndexes: ['name', 'apiKeyHash', 'labels'],
})

const toProject = (data: any): Project => ({
  id: getID(data),
  name: data.name,
  urlPath: data.urlPath,
  labels: JSON.parse(data.labels),
  timestamp: getTimestamp(data),
})

export async function addProjectForUser(userID: number, projectName: string) {
  const urlPath = ProjectNameToURLPath(projectName)
  if (!CheckValidURLPath(urlPath)) {
    throw new Error(`URL path '${urlPath}' is invalid`)
  }
  if (await checkProject(urlPath)) {
    throw new Error(`URL path '${urlPath}' already exists`)
  }
  const projectData = toProjectData(userID, projectName, urlPath, [], new Date())
  await getDatastore().save(projectData)
  return toID(projectData)
}

export async function checkProject(urlPath: string, apiKey?: string): Promise<boolean> {
  const projectData = await getEntity(Entity.PROJECT, 'urlPath', urlPath)
  return projectData && (!apiKey || projectData.apiKeyHash === hashAPIKey(apiKey))
}

export async function getURLPathForProject(userID: number, projectID: number): Promise<string> {
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  if (projectData?.userID !== userID) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  return projectData.urlPath
}

async function updateProject(projectData: any) {
  await getDatastore().save(
    toProjectData(
      projectData.userID,
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
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  if (projectData?.userID !== userID) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  return projectData
}

export async function ensureProjectLabels(
  userID: number,
  projectID: number,
  labels: string[]
) {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const oldLabels = JSON.parse(projectData.labels)
  const newLabels = [...oldLabels, ...labels.filter(label => !oldLabels.includes(label))]
  await updateProject({ ...projectData, labels: newLabels })
}

export async function rotateProjectAPIKey(userID: number, projectID: number): Promise<string> {
  const projectData = await getVerifiedUserProjectData(userID, projectID)
  const apiKey = `sk-${new ShortUniqueId({ length: 48, dictionary: 'alphanum' })()}`
  const apiKeyHash = hashAPIKey(apiKey)
  await updateProject({ ...projectData, apiKeyHash })
  return apiKey
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const projects = await getOrderedEntities(Entity.PROJECT, 'userID', userID)
  return projects.map(project => toProject(project))
}
