import {
  Entity,
  buildKey,
  getDatastore,
  getEntityIDs,
  getEntityKeys,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
} from './datastore'
import { ActiveWorkspace, PendingUser, PendingWorkspace, User, Workspace } from '@/types'
import { deleteProjectForUser, toProject } from './projects'
import {
  getAccessibleObjectIDs,
  getAccessingUserIDs,
  grantUserAccess,
  grantUsersAccess,
  hasUserAccess,
  revokeUserAccess,
} from './access'
import { toUser } from './users'

export async function migrateWorkspaces() {
  const datastore = getDatastore()
  const [allWorkspaces] = await datastore.runQuery(datastore.createQuery(Entity.WORKSPACE))
  for (const workspaceData of allWorkspaces) {
    await updateWorkspace({ ...workspaceData })
  }
}

const toWorkspaceData = (userID: number, name: string, createdAt: Date, workspaceID?: number) => ({
  key: buildKey(Entity.WORKSPACE, workspaceID),
  data: { userID, name, createdAt },
  excludeFromIndexes: ['name'],
})

const toWorkspace = (data: any): Workspace => ({
  id: getID(data),
  name: data.name,
})

export const getWorkspaceUsers = (workspaceID: number): Promise<[User[], PendingUser[]]> =>
  getPendingAccessObjects(workspaceID, 'workspace', Entity.USER, toUser)

export async function getActiveWorkspace(userID: number, workspaceID: number): Promise<ActiveWorkspace> {
  const workspaceData = await getVerifiedUserWorkspaceData(userID, workspaceID)
  const projectData = await getOrderedEntities(Entity.PROJECT, 'workspaceID', workspaceID, ['lastEditedAt'])
  const projects = projectData.map(project => toProject(project, userID))
  const [users, pendingUsers] = await getWorkspaceUsers(workspaceID)

  return {
    ...toWorkspace(workspaceData),
    projects: [...projects.filter(project => project.favorited), ...projects.filter(project => !project.favorited)],
    users,
    pendingUsers,
  }
}

export async function addWorkspaceForUser(userID: number, workspaceName?: string) {
  const workspaceData = toWorkspaceData(
    userID,
    workspaceName ?? 'Drafts',
    new Date(),
    workspaceName ? undefined : userID
  )
  await getDatastore().save(workspaceData)
  const workspaceID = getID(workspaceData)
  await grantUserAccess(userID, userID, workspaceID, 'workspace')
  return workspaceID
}

export async function inviteMembersToWorkspace(userID: number, workspaceID: number, emails: string[]) {
  if (workspaceID === userID) {
    throw new Error('Cannot invite to Drafts workspace')
  }
  await getVerifiedUserWorkspaceData(userID, workspaceID)
  await grantUsersAccess(userID, emails, workspaceID, 'workspace')
}

export async function revokeMemberAccessForWorkspace(userID: number, workspaceID: number) {
  await revokeUserAccess(userID, workspaceID)
}

async function updateWorkspace(workspaceData: any) {
  await getDatastore().save(
    toWorkspaceData(workspaceData.userID, workspaceData.name, workspaceData.createdAt, getID(workspaceData))
  )
}

export async function ensureWorkspaceAccess(userID: number, workspaceID: number) {
  const hasAccess = await hasUserAccess(userID, workspaceID)
  if (!hasAccess) {
    throw new Error(`Workspace with ID ${workspaceID} does not exist or user has no access`)
  }
}

const getVerifiedUserWorkspaceData = async (userID: number, workspaceID: number) => {
  await ensureWorkspaceAccess(userID, workspaceID)
  return getKeyedEntity(Entity.WORKSPACE, workspaceID)
}

export async function updateWorkspaceName(userID: number, workspaceID: number, name: string) {
  if (workspaceID === userID) {
    throw new Error('Cannot rename Drafts workspace')
  }
  const workspaceData = await getVerifiedUserWorkspaceData(userID, workspaceID)
  await updateWorkspace({ ...workspaceData, name })
}

export const getWorkspacesForUser = (userID: number): Promise<[Workspace[], PendingWorkspace[]]> =>
  getPendingAccessObjects(userID, 'workspace', Entity.WORKSPACE, toWorkspace)

export async function getPendingAccessObjects<T>(
  sourceID: number,
  kind: 'project' | 'workspace',
  entityType: string,
  toObject: (data: any) => T
): Promise<[T[], (T & { invitedBy: User; timestamp: number })[]]> {
  const sourceIsUser = entityType !== Entity.USER
  const [objectIDs, pendingObjects] = sourceIsUser
    ? await getAccessibleObjectIDs(sourceID, kind)
    : await getAccessingUserIDs(sourceID, kind)

  const pendingObjectIDs = pendingObjects.map(access => access.objectID)
  const invitingUserIDs = pendingObjects.map(access => access.invitedBy)

  const objectsData = await getKeyedEntities(entityType, [...objectIDs, ...pendingObjectIDs])
  const invitingUsersData = await getKeyedEntities(Entity.USER, invitingUserIDs)
  const invitingUsers = invitingUsersData.map(toUser)

  const toPendingObject = (object: T, { invitedBy, timestamp }: { invitedBy: number; timestamp: number }) => ({
    ...object,
    invitedBy: invitingUsers.find(user => user.id === invitedBy)!,
    timestamp,
  })

  const sortObjects = sourceIsUser
    ? (a: any, b: any) => b.createdAt - a.createdAt
    : (a: any, b: any) => a.fullName.localeCompare(b.fullName)

  return [
    objectsData
      .filter(objectData => !pendingObjectIDs.includes(getID(objectData)))
      .sort(sortObjects)
      .map(toObject),
    objectsData
      .filter(objectData => pendingObjectIDs.includes(getID(objectData)))
      .sort(sortObjects)
      .map(objectData =>
        toPendingObject(toObject(objectData), pendingObjects.find(access => access.objectID === getID(objectData))!)
      ),
  ]
}

export async function deleteWorkspaceForUser(userID: number, workspaceID: number) {
  await ensureWorkspaceAccess(userID, workspaceID)
  if (workspaceID === userID) {
    throw new Error('Cannot delete Drafts workspace')
  }
  const accessKeys = await getEntityKeys(Entity.ACCESS, 'objectID', workspaceID)
  if (accessKeys.length > 1) {
    throw new Error('Cannot delete multi-user workspace')
  }
  const projectIDs = await getEntityIDs(Entity.PROJECT, 'workspaceID', workspaceID)
  for (const projectID of projectIDs) {
    await deleteProjectForUser(userID, projectID)
  }
  await getDatastore().delete([...accessKeys, buildKey(Entity.WORKSPACE, workspaceID)])
}
