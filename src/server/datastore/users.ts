import { User } from '@/types'
import { Entity, buildKey, getDatastore, getEntity, getID, getKeyedEntity, getOrderedEntities } from './datastore'
import { addWorkspaceForUser } from './workspaces'

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
}

export async function getUsersWithoutAccess() {
  const usersData = await getOrderedEntities(Entity.USER, 'hasAccess', false)
  return usersData.map(toUser)
}
