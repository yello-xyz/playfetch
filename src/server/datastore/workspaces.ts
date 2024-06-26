import {
  Entity,
  buildKey,
  getDatastore,
  getEntityKeys,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
} from './datastore'
import { ActiveUser, ActiveWorkspace, PendingUser, PendingWorkspace, User, Workspace, WorkspaceMetrics } from '@/types'
import { filterObjects, getRecentProjects, toProject } from './projects'
import {
  checkUserOwnership,
  getAccessibleObjectIDs,
  getAccessingUserIDs,
  grantUserAccess,
  grantUsersAccess,
  hasUserAccess,
  revokeUserAccess,
} from './access'
import { getActiveUsers, toUser } from './users'
import { deleteEntities } from './cleanup'

export async function migrateWorkspaces(postMerge: boolean) {
  if (postMerge) {
    return
  }
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

export async function getActiveWorkspace(userID: number, workspaceID: number): Promise<ActiveWorkspace> {
  const workspaceData = await getVerifiedUserWorkspaceData(userID, workspaceID)
  return loadActiveWorkspace(userID, toWorkspace(workspaceData))
}

async function loadActiveWorkspace(userID: number, workspace: Workspace): Promise<ActiveWorkspace> {
  const projectData = await getOrderedEntities(Entity.PROJECT, 'workspaceID', workspace.id, ['lastEditedAt'])
  const [ownedProjectIDs] = await getAccessibleObjectIDs(userID, 'project')
  const projects = projectData.map(project => toProject(project, userID, ownedProjectIDs.includes(getID(project))))
  const [users, pendingUsers, owners] = await getWorkspaceUsers(workspace.id)

  const owner = owners.find(user => user.id === userID)

  return {
    ...workspace,
    projects: [...projects.filter(project => project.favorited), ...projects.filter(project => !project.favorited)],
    owners: owner ? [owner, ...filterObjects(owners, [owner])] : [],
    users,
    pendingUsers,
  }
}

export async function addWorkspaceForUser(userID: number, workspaceName?: string) {
  const createdAt = new Date()
  const workspaceData = toWorkspaceData(
    userID,
    workspaceName ?? 'Drafts',
    createdAt,
    workspaceName ? undefined : userID
  )
  await getDatastore().save(workspaceData)
  const workspaceID = getID(workspaceData)
  await grantUserAccess(userID, userID, workspaceID, 'workspace', 'owner', createdAt)
  return workspaceID
}

export async function inviteMembersToWorkspace(userID: number, workspaceID: number, emails: string[]) {
  if (workspaceID === userID) {
    throw new Error('Cannot invite to Drafts workspace')
  }
  await getVerifiedUserWorkspaceData(userID, workspaceID)
  await grantUsersAccess(userID, emails, workspaceID, 'workspace')
}

export async function revokeMemberAccessForWorkspace(userID: number, memberID: number, workspaceID: number) {
  if (userID !== memberID) {
    await ensureWorkspaceOwnership(userID, workspaceID)
  }
  await revokeUserAccess(memberID, workspaceID)
}

export async function toggleOwnershipForWorkspace(
  userID: number,
  memberID: number,
  workspaceID: number,
  isOwner: boolean
) {
  if (userID !== memberID) {
    await ensureWorkspaceOwnership(userID, workspaceID)
    await grantUserAccess(userID, memberID, workspaceID, 'workspace', isOwner ? 'owner' : 'default')
  }
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
  return getTrustedWorkspaceData(workspaceID)
}

const getTrustedWorkspaceData = async (workspaceID: number) => getKeyedEntity(Entity.WORKSPACE, workspaceID)

export const getWorkspaceName = (workspaceID: number) => getTrustedWorkspaceData(workspaceID).then(data => data.name)

export async function updateWorkspaceName(userID: number, workspaceID: number, name: string) {
  if (workspaceID === userID) {
    throw new Error('Cannot rename Drafts workspace')
  }
  const workspaceData = await getVerifiedUserWorkspaceData(userID, workspaceID)
  await updateWorkspace({ ...workspaceData, name })
}

export const getWorkspacesForUser = (userID: number): Promise<[Workspace[], PendingWorkspace[]]> =>
  getPendingAccessObjects(userID, 'workspace', Entity.WORKSPACE, toWorkspace).then(([u, p]) => [u, p])

export const getWorkspaceUsers = (workspaceID: number): Promise<[User[], PendingUser[], User[]]> =>
  getPendingAccessObjects(workspaceID, 'workspace', Entity.USER, toUser).then(([users, pendingUsers, owners]) => [
    [...owners, ...filterObjects(users, owners)],
    pendingUsers,
    owners,
  ])

export async function getPendingAccessObjects<T>(
  sourceID: number,
  kind: 'project' | 'workspace',
  entityType: Entity,
  toObject: (data: any) => T
): Promise<[T[], (T & { invitedBy: User; timestamp: number })[], T[]]> {
  const sourceIsUser = entityType !== Entity.USER
  const [ownedObjectIDs, accessibleObjectIDs, pendingObjects] = sourceIsUser
    ? await getAccessibleObjectIDs(sourceID, kind)
    : await getAccessingUserIDs(sourceID, kind)

  const getAccessID = (access: any) => (sourceIsUser ? access.objectID : access.userID)
  const pendingObjectIDs = pendingObjects.map(getAccessID)
  const invitingUserIDs = pendingObjects.map(access => access.invitedBy)

  const objectsData = await getKeyedEntities(entityType, [
    ...ownedObjectIDs,
    ...accessibleObjectIDs,
    ...pendingObjectIDs,
  ])
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
        toPendingObject(toObject(objectData), pendingObjects.find(access => getAccessID(access) === getID(objectData))!)
      ),
    objectsData
      .filter(objectData => ownedObjectIDs.includes(getID(objectData)))
      .sort(sortObjects)
      .map(toObject),
  ]
}

const ensureWorkspaceOwnership = (userID: number, workspaceID: number) => checkUserOwnership(userID, workspaceID)

export async function deleteWorkspaceForUser(userID: number, workspaceID: number) {
  await ensureWorkspaceOwnership(userID, workspaceID)
  if (workspaceID === userID) {
    throw new Error('Cannot delete Drafts workspace')
  }
  const projectKeys = await getEntityKeys(Entity.PROJECT, 'workspaceID', workspaceID, 1000)
  await deleteEntities([buildKey(Entity.WORKSPACE, workspaceID), ...projectKeys])
}

export async function getMetricsForWorkspace(workspaceID: number, before?: Date): Promise<WorkspaceMetrics> {
  const workspaceData = await getTrustedWorkspaceData(workspaceID)
  const activeWorkspace = await loadActiveWorkspace(0, toWorkspace(workspaceData))

  const recentProjects = await getRecentProjects(activeWorkspace.projects)
  const activeUsers = (await getActiveUsers(
    [...activeWorkspace.users, ...activeWorkspace.pendingUsers],
    before
  )) as (PendingUser & ActiveUser)[]

  return {
    ...activeWorkspace,
    projects: recentProjects,
    users: activeUsers.filter(user => activeWorkspace.users.some(u => u.id === user.id)),
    pendingUsers: activeUsers.filter(user => activeWorkspace.pendingUsers.some(u => u.id === user.id)),
  }
}
