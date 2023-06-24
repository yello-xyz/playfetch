import { and } from '@google-cloud/datastore'
import { Entity, buildFilter, buildKey, getDatastore, getEntities, getFilteredEntityKey } from './datastore'

const getUserAccessKey = (userID: number, projectID: number) =>
  getFilteredEntityKey(Entity.ACCESS, and([buildFilter('userID', userID), buildFilter('projectID', projectID)]))

export async function hasUserAccess(userID: number, projectID: number) {
  const accessKey = await getUserAccessKey(userID, projectID)
  return !!accessKey
}

export async function grantUserAccess(userID: number, projectID: number) {
  const hasAccess = await hasUserAccess(userID, projectID)
  if (!hasAccess) {
    await getDatastore().save({ key: buildKey(Entity.ACCESS), data: { userID, projectID } })
  }
}

export async function revokeUserAccess(userID: number, projectID: number) {
  const accessKey = await getUserAccessKey(userID, projectID)
  if (accessKey) {
    await getDatastore().delete(accessKey)
  }
}

export async function getProjectsIDsForUser(userID: number): Promise<number[]> {
  const entities = await getEntities(Entity.ACCESS, 'userID', userID)
  return entities.map(entity => entity.projectID)
}

export async function getUserIDsForProject(projectID: number): Promise<number[]> {
  const entities = await getEntities(Entity.ACCESS, 'projectID', projectID)
  return entities.map(entity => entity.userID)
}
