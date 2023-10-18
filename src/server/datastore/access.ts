import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getFilteredEntities,
  getFilteredEntityKey,
  getID,
  getKeyedEntity,
} from './datastore'
import { getUserForEmail } from './users'

type Kind = 'project' | 'workspace'
type State = 'default' | 'pending'

export async function migrateAccess(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allAccess] = await datastore.runQuery(datastore.createQuery(Entity.ACCESS))
  for (const accessData of allAccess) {
    if (!accessData.grantedBy && !accessData.createdAt) {
      console.log(`Migrating access key ${getID(accessData)} (${accessData.kind} ${accessData.objectID})`)
      let workspaceID = accessData.objectID
      if (accessData.kind === 'project') {
        const projectData = await getKeyedEntity(Entity.PROJECT, accessData.objectID)
        if (!projectData) {
          console.log('→ dangling project acces key?')
          continue
        }
        workspaceID = projectData.workspaceID
      }
      const workspaceData = await getKeyedEntity(Entity.WORKSPACE, workspaceID)
      if (!workspaceData) {
        if (accessData.userID === workspaceID) {
          const userData = await getKeyedEntity(Entity.USER, accessData.userID)
          if (!userData) {
            console.log('Deleting dangling workspace access key for deleted user and workspace')
            datastore.delete(buildKey(Entity.ACCESS, getID(accessData)))
            continue
          }
        }
        console.log('→ dangling workspace?')
        continue
      }
      datastore.save(
        toAccessData(
          accessData.userID,
          accessData.objectID,
          accessData.kind,
          'default',
          workspaceData.userID,
          workspaceData.createdAt,
          getID(accessData)
        )
      )
    }
  }
}

const getUserAccessKey = (userID: number, objectID: number) =>
  getFilteredEntityKey(Entity.ACCESS, and([buildFilter('userID', userID), buildFilter('objectID', objectID)]))

export async function hasUserAccess(userID: number, objectID: number) {
  const accessKey = await getUserAccessKey(userID, objectID)
  return !!accessKey
}

export async function grantUserAccess(grantedBy: number, userID: number, objectID: number, kind: Kind) {
  const hasAccess = await hasUserAccess(userID, objectID)
  if (!hasAccess) {
    const state = userID === grantedBy ? 'default' : 'pending'
    await getDatastore().save(toAccessData(userID, objectID, kind, state, grantedBy, new Date()))
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

export async function grantUsersAccess(
  userID: number,
  emails: string[],
  objectID: number,
  kind: 'project' | 'workspace'
) {
  for (const email of emails) {
    const user = await getUserForEmail(email.toLowerCase(), true)
    if (user) {
      await grantUserAccess(userID, user.id, objectID, kind)
      // TODO send notification (but only if they already have access)
    } else {
      // TODO send invite to sign up (if we automatically want to give people access)
      // Or even automatically sign them up to the waitlist (but maybe not?)
    }
  }
}

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
