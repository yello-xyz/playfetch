import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getFilteredEntities,
  getFilteredEntity,
  getID,
  getTimestamp,
} from './datastore'
import { getUserForEmail } from './users'
import { sendInviteEmail } from '../email'

type Kind = 'project' | 'workspace'
type State = 'owner' | 'default' | 'pending'

export async function migrateAccess(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allAccess] = await datastore.runQuery(datastore.createQuery(Entity.ACCESS))
  for (const accessData of allAccess) {
    datastore.save(
      toAccessData(
        accessData.userID,
        accessData.objectID,
        accessData.kind,
        accessData.state,
        accessData.grantedBy,
        accessData.createdAt,
        getID(accessData)
      )
    )
  }
}

const getAccessData = (userID: number, objectID: number) =>
  getFilteredEntity(Entity.ACCESS, and([buildFilter('userID', userID), buildFilter('objectID', objectID)]))

export async function hasUserAccess(userID: number, objectID: number) {
  const accessData = await getAccessData(userID, objectID)
  return !!accessData && (accessData.state === 'default' || accessData.state === 'owner')
}

export async function grantUserAccess(
  grantedBy: number,
  userID: number,
  objectID: number,
  kind: Kind,
  state: State,
  createdAt = new Date()
) {
  const accessData = await getAccessData(userID, objectID)
  if (!accessData || accessData.state !== state) {
    await getDatastore().save(
      toAccessData(userID, objectID, kind, state, grantedBy, createdAt, accessData ? getID(accessData) : undefined)
    )
  }
}

export async function revokeUserAccess(userID: number, objectID: number) {
  const accessData = await getAccessData(userID, objectID)
  if (accessData) {
    await getDatastore().delete(buildKey(Entity.ACCESS, getID(accessData)))
  }
}

export async function updateAccessForUser(userID: number, objectID: number, accept: boolean) {
  const accessData = await getAccessData(userID, objectID)
  if (accessData && accessData.state === 'pending') {
    if (accept) {
      await getDatastore().save(
        toAccessData(
          userID,
          objectID,
          accessData.kind,
          'default',
          accessData.grantedBy,
          accessData.createdAt,
          getID(accessData)
        )
      )
    } else {
      await getDatastore().delete(buildKey(Entity.ACCESS, getID(accessData)))
    }
  }
}

export async function getAccessibleObjectIDs(
  userID: number,
  kind: Kind
): Promise<[number[], number[], PendingAccess[]]> {
  const entities = await getFilteredEntities(
    Entity.ACCESS,
    and([buildFilter('userID', userID), buildFilter('kind', kind)])
  )
  return [
    entities.filter(entity => entity.state === 'owner').map(entity => entity.objectID),
    entities.filter(entity => entity.state === 'default').map(entity => entity.objectID),
    entities.filter(entity => entity.state === 'pending').map(toPendingAccess),
  ]
}

export async function getAccessingUserIDs(
  objectID: number,
  kind: Kind
): Promise<[number[], number[], PendingAccess[]]> {
  const entities = await getFilteredEntities(
    Entity.ACCESS,
    and([buildFilter('objectID', objectID), buildFilter('kind', kind)])
  )
  return [
    entities.filter(entity => entity.state === 'owner').map(entity => entity.userID),
    entities.filter(entity => entity.state === 'default').map(entity => entity.userID),
    entities.filter(entity => entity.state === 'pending').map(toPendingAccess),
  ]
}

export async function grantUsersAccess(
  userID: number,
  emails: string[],
  objectID: number,
  kind: 'project' | 'workspace'
) {
  for (const email of emails) {
    const user = await getUserForEmail(email.toLowerCase(), true)
    if (user) {
      await grantUserAccess(userID, user.id, objectID, kind, 'pending')
      hasUserAccess(user.id, user.id).then(hasAccess =>
        hasAccess ? sendInviteEmail(userID, email, objectID, kind) : {}
      )
    } else {
      // TODO send invite to sign up (if we automatically want to give people access)
      // Or even automatically sign them up to the waitlist (but maybe not?)
    }
  }
}

type PendingAccess = {
  userID: number
  objectID: number
  invitedBy: number
  timestamp: number
}

const toPendingAccess = (accessData: any): PendingAccess => ({
  userID: accessData.userID,
  objectID: accessData.objectID,
  invitedBy: accessData.grantedBy,
  timestamp: getTimestamp(accessData),
})

const toAccessData = (
  userID: number,
  objectID: number,
  kind: Kind,
  state: State,
  grantedBy: number,
  createdAt: Date,
  accessID?: number
) => ({
  key: buildKey(Entity.ACCESS, accessID),
  data: { userID, objectID, kind, state, grantedBy, createdAt },
  excludeFromIndexes: [],
})
