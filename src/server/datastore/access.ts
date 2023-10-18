import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getFilteredEntities,
  getFilteredEntityKey,
  getID,
} from './datastore'
import { getUserForEmail } from './users'

type Kind = 'project' | 'workspace'

export async function migrateAccess() {
  const datastore = getDatastore()
  const [allAccess] = await datastore.runQuery(datastore.createQuery(Entity.ACCESS))
  for (const accessData of allAccess) {
    datastore.save(toAccessData(accessData.userID, accessData.objectID, accessData.kind, getID(accessData)))
  }
}

const getUserAccessKey = (userID: number, objectID: number) =>
  getFilteredEntityKey(Entity.ACCESS, and([buildFilter('userID', userID), buildFilter('objectID', objectID)]))

export async function hasUserAccess(userID: number, objectID: number) {
  const accessKey = await getUserAccessKey(userID, objectID)
  return !!accessKey
}

export async function grantUserAccess(userID: number, objectID: number, kind: Kind) {
  const hasAccess = await hasUserAccess(userID, objectID)
  if (!hasAccess) {
    await getDatastore().save(toAccessData(userID, objectID, kind))
  }
}

export async function revokeUserAccess(userID: number, objectID: number) {
  const accessKey = await getUserAccessKey(userID, objectID)
  if (accessKey) {
    await getDatastore().delete(accessKey)
  }
}

export async function getAccessibleObjectIDs(userID: number, kind: Kind): Promise<number[]> {
  const entities = await getFilteredEntities(
    Entity.ACCESS,
    and([buildFilter('userID', userID), buildFilter('kind', kind)])
  )
  return entities.map(entity => entity.objectID)
}

export async function getAccessingUserIDs(objectID: number, kind: Kind): Promise<number[]> {
  const entities = await getFilteredEntities(
    Entity.ACCESS,
    and([buildFilter('objectID', objectID), buildFilter('kind', kind)])
  )
  return entities.map(entity => entity.userID)
}

export async function grantUsersAccess(emails: string[], objectID: number, kind: 'project' | 'workspace') {
  for (const email of emails) {
    const user = await getUserForEmail(email.toLowerCase(), true)
    if (user) {
      await grantUserAccess(user.id, objectID, kind)
      // TODO send notification (but only if they already have access)
    } else {
      // TODO send invite to sign up (if we automatically want to give people access)
      // Or even automatically sign them up to the waitlist (but maybe not?)
    }
  }
}

const toAccessData = (userID: number, objectID: number, kind: Kind, accessID?: number) => ({
  key: buildKey(Entity.ACCESS, accessID),
  data: { userID, objectID, kind },
  excludeFromIndexes: [],
})
