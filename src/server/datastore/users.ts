import { ActiveUser, IsRawPromptVersion, User, UserMetrics } from '@/types'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getEntity,
  getEntityCount,
  getFilteredEntityCount,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
} from './datastore'
import { addWorkspaceForUser, getWorkspacesForUser } from './workspaces'
import { uploadImageURLToStorage } from '../storage'
import { getRecentVersions } from './versions'
import { getRecentComments } from './comments'
import { getRecentEndpoints } from './endpoints'
import { and } from '@google-cloud/datastore'
import { getRecentProjects, getSharedProjectsForUser } from './projects'

export async function migrateUsers(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allUsers] = await datastore.runQuery(datastore.createQuery(Entity.USER))
  for (const userData of allUsers) {
    await getDatastore().save(
      toUserData(
        userData.email,
        userData.fullName,
        userData.imageURL,
        userData.hasAccess,
        userData.isAdmin,
        userData.createdAt,
        userData.lastLoginAt,
        getID(userData)
      )
    )
  }
}

const toUserData = (
  email: string,
  fullName: string,
  imageURL: string,
  hasAccess: boolean,
  isAdmin: boolean,
  createdAt: Date,
  lastLoginAt?: Date,
  userID?: number
) => ({
  key: buildKey(Entity.USER, userID),
  data: { email, fullName, imageURL, hasAccess, isAdmin, createdAt, lastLoginAt },
  excludeFromIndexes: ['fullName', 'imageURL'],
})

export const toUser = (data: any): User => ({
  id: getID(data),
  email: data.email,
  fullName: data.fullName,
  imageURL: data.imageURL,
  isAdmin: data.isAdmin,
})

export const getUserForID = (userID: number) => getKeyedEntity(Entity.USER, userID).then(toUser)

export async function getUserForEmail(email: string, includingWithoutAccess = false) {
  const userData = await getEntity(Entity.USER, 'email', email)
  return userData && (includingWithoutAccess || userData.hasAccess) ? toUser(userData) : undefined
}

export async function markUserLogin(userID: number, fullName: string, imageURL: string) {
  const userData = await getKeyedEntity(Entity.USER, userID)
  if (userData) {
    if (imageURL.length) {
      imageURL = await uploadImageURLToStorage(userID.toString(), imageURL)
    }
    await getDatastore().save(
      toUserData(
        userData.email,
        fullName.length ? fullName : userData.fullName,
        imageURL.length ? imageURL : userData.imageURL,
        userData.hasAccess,
        userData.isAdmin,
        userData.createdAt,
        new Date(),
        userID
      )
    )
  }
  return userData ? toUser(userData) : undefined
}

export async function saveUser(email: string, fullName: string, hasAccess = false, isAdmin = false) {
  const previousUserData = await getEntity(Entity.USER, 'email', email)
  const userData = toUserData(
    email.trim().toLowerCase(),
    (fullName.length ? fullName : email).trim(),
    previousUserData?.imageURL ?? '',
    hasAccess,
    isAdmin,
    previousUserData?.createdAt ?? new Date(),
    previousUserData?.lastLoginAt,
    previousUserData ? getID(previousUserData) : undefined
  )
  await getDatastore().save(userData)
  if (hasAccess && (!previousUserData || !previousUserData.hasAccess)) {
    const userID = getID(userData)
    await addWorkspaceForUser(userID)
    await addWorkspaceForUser(userID, 'My first workspace')
  }
  return !previousUserData
}

export async function getUsersWithoutAccess() {
  const usersData = await getOrderedEntities(Entity.USER, 'hasAccess', false)
  return usersData.map(toUser)
}

export async function getActiveUsers(users?: User[], before?: Date, limit = 100): Promise<ActiveUser[]> {
  const recentVersions = await getRecentVersions(before, limit)
  const since = new Date(recentVersions.slice(-1)[0]?.timestamp ?? 0)

  const recentComments = recentVersions.length > 0 ? await getRecentComments(since, before, limit) : []
  const recentEndpoints = recentVersions.length > 0 ? await getRecentEndpoints(since, before, limit) : []

  if (!users) {
    const usersData = await getKeyedEntities(Entity.USER, [
      ...new Set([
        ...recentVersions.map(version => version.userID),
        ...recentComments.map(comment => comment.userID),
        ...recentEndpoints.map(endpoint => endpoint.userID),
      ]),
    ])
    users = usersData.map(toUser)
  }

  return users
    .map(user => toActiveUser(user, recentVersions, recentComments, recentEndpoints))
    .sort((a, b) => b.lastActive - a.lastActive)
}

const toActiveUser = (
  user: User,
  recentVersions: Awaited<ReturnType<typeof getRecentVersions>>,
  recentComments: Awaited<ReturnType<typeof getRecentComments>>,
  recentEndpoints: Awaited<ReturnType<typeof getRecentEndpoints>>
): ActiveUser => {
  const userVersions = recentVersions.filter(version => version.userID === user.id)
  const versionCount = userVersions.length

  const userComments = recentComments.filter(comment => comment.userID === user.id)
  const commentCount = userComments.length

  const userEndpoints = recentEndpoints.filter(endpoint => endpoint.userID === user.id)
  const endpointCount = userEndpoints.length

  const lastActive = Math.max(
    ...[userVersions[0]?.timestamp ?? 0, userComments[0]?.timestamp ?? 0, userEndpoints[0]?.timestamp ?? 0]
  )
  const startTimestamp = Math.min(
    ...[
      userVersions.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
      userComments.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
      userEndpoints.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
    ]
  )

  const promptVersions = userVersions.filter(IsRawPromptVersion)
  const promptCount = new Set(promptVersions.map(version => version.parentID)).size
  const chainVersions = userVersions.filter(version => !IsRawPromptVersion(version))
  const chainCount = new Set(chainVersions.map(version => version.parentID)).size

  return { ...user, lastActive, startTimestamp, commentCount, endpointCount, versionCount, promptCount, chainCount }
}

export async function getMetricsForUser(userID: number): Promise<UserMetrics> {
  const createdWorkspaceCount = await getEntityCount(Entity.WORKSPACE, 'userID', userID)
  const workspaceAccessCount = await getFilteredEntityCount(
    Entity.ACCESS,
    and([buildFilter('userID', userID), buildFilter('kind', 'workspace')])
  )
  const projectAccessCount = await getFilteredEntityCount(
    Entity.ACCESS,
    and([buildFilter('userID', userID), buildFilter('kind', 'project')])
  )

  const [sharedProjects, pendingSharedProjects] = await getSharedProjectsForUser(userID)
  const sharedProjectsAsRecent = await getRecentProjects(sharedProjects)
  const pendingSharedProjectsAsRecent = await getRecentProjects(pendingSharedProjects)

  const [workspaces, pendingWorkspaces] = await getWorkspacesForUser(userID)

  const createdVersionCount = await getEntityCount(Entity.VERSION, 'userID', userID)
  const createdCommentCount = await getEntityCount(Entity.COMMENT, 'userID', userID)
  const createdEndpointCount = await getEntityCount(Entity.ENDPOINT, 'userID', userID)

  const providersData = await getEntities(Entity.PROVIDER, 'userID', userID)
  const providers = providersData.map(providerData => ({ provider: providerData.provider, cost: providerData.cost }))

  return {
    createdWorkspaceCount,
    workspaceAccessCount,
    projectAccessCount,
    createdVersionCount,
    createdCommentCount,
    createdEndpointCount,
    providers,
    sharedProjects: sharedProjectsAsRecent,
    pendingSharedProjects: pendingSharedProjectsAsRecent,
    workspaces,
    pendingWorkspaces
  }
}
