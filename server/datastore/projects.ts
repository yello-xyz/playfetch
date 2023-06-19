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

const hashAPIKey = (apiKey: string) => createHash('sha256').update(apiKey).digest('hex')

const toProjectData = (
  userID: number,
  name: string,
  urlPath: string,
  createdAt: Date,
  apiKeyHash?: string,
  projectID?: number
) => ({
  key: buildKey(Entity.PROJECT, projectID),
  data: { userID, name, createdAt, urlPath, apiKeyHash },
  excludeFromIndexes: ['name', 'apiKeyHash'],
})

const toProject = (data: any): Project => ({
  id: getID(data),
  name: data.name,
  urlPath: data.urlPath ?? '',
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
  const projectData = toProjectData(userID, projectName, urlPath, new Date())
  await getDatastore().save(projectData)
  return toID(projectData)
}

export async function checkProject(urlPath: string, apiKey?: string): Promise<boolean> {
  const projectData = await getEntity(Entity.PROJECT, 'urlPath', urlPath)
  return projectData && (!apiKey || projectData.apiKeyHash === hashAPIKey(apiKey))
}

export async function getURLPathForProject(projectID: number): Promise<string> {
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  return projectData?.urlPath ?? ''
}

export async function rotateProjectAPIKey(userID: number, projectID: number): Promise<string> {
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  if (projectData?.userID !== userID) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  const apiKey = `sk-${new ShortUniqueId({ length: 48, dictionary: 'alphanum' })()}`
  const apiKeyHash = hashAPIKey(apiKey)
  await getDatastore().save(
    toProjectData(
      projectData.userID,
      projectData.name,
      projectData.urlPath,
      projectData.createdAt,
      apiKeyHash,
      projectID
    )
  )
  return apiKey
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const projects = await getOrderedEntities(Entity.PROJECT, 'userID', userID)
  return projects.map(project => toProject(project))
}
