import { ActiveUser, IsRawPromptVersion, User } from '@/types'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getOrderedEntities,
} from './datastore'
import { addWorkspaceForUser } from './workspaces'
import { uploadImageURLToStorage } from '../storage'
import { getRecentVersions } from './versions'
import { getRecentComments } from './comments'

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
    await addWorkspaceForUser(getID(userData))
  }
  return !previousUserData
}

export async function getUsersWithoutAccess() {
  const usersData = await getOrderedEntities(Entity.USER, 'hasAccess', false)
  return usersData.map(toUser)
}

export async function getActiveUsers(limit = 100): Promise<ActiveUser[]> {
  const recentVersions = await getRecentVersions(limit)
  const startTimestamp = recentVersions.slice(-1)[0].timestamp

  const recentComments = await getRecentComments(startTimestamp, limit)
  const usersData = await getKeyedEntities(Entity.USER, [
    ...new Set([...recentVersions.map(version => version.userID), ...recentComments.map(comment => comment.userID)]),
  ])
  return usersData
    .map(usersData => toActiveUser(usersData, recentVersions, recentComments))
    .sort((a, b) => b.lastActive - a.lastActive)
}

const toActiveUser = (
  userData: any,
  recentVersions: Awaited<ReturnType<typeof getRecentVersions>>,
  recentComments: Awaited<ReturnType<typeof getRecentComments>>
): ActiveUser => {
  const user = toUser(userData)

  const userVersions = recentVersions.filter(version => version.userID === user.id)
  const versionCount = userVersions.length

  const userComments = recentComments.filter(comment => comment.userID === user.id)
  const commentCount = userComments.length

  const lastActive = Math.max(userVersions[0]?.timestamp ?? 0, userComments[0]?.timestamp ?? 0)
  const startTimestamp = Math.min(
    userVersions.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE,
    userComments.slice(-1)[0]?.timestamp ?? Number.MAX_VALUE
  )

  const promptVersions = userVersions.filter(IsRawPromptVersion)
  const promptCount = new Set(promptVersions.map(version => version.parentID)).size
  const chainVersions = userVersions.filter(version => !IsRawPromptVersion(version))
  const chainCount = new Set(chainVersions.map(version => version.parentID)).size

  return { ...user, lastActive, startTimestamp, commentCount, versionCount, promptCount, chainCount }
}
