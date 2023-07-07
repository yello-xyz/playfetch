import { User } from '@/types'
import { Entity, buildKey, getDatastore, getEntity, getID, getKeyedEntity } from './datastore'
import { addProjectForUser } from './projects'

export async function migrateUsers() {
  const datastore = getDatastore()
  const [allUsers] = await datastore.runQuery(datastore.createQuery(Entity.USER))
  for (const userData of allUsers) {
    await getDatastore().save(
      toUserData(
        userData.email,
        userData.fullName,
        userData.avatarColor,
        userData.isAdmin,
        userData.createdAt,
        userData.lastLoginAt,
        userData.verifiedAt,
        getID(userData)
      )
    )
  }
}

const toUserData = (
  email: string,
  fullName: string,
  imageURL: string,
  isAdmin: boolean,
  createdAt: Date,
  lastLoginAt?: Date,
  verifiedAt?: Date,
  userID?: number
) => ({
  key: buildKey(Entity.USER, userID),
  data: { email, fullName, imageURL, isAdmin, createdAt, lastLoginAt, verifiedAt },
  excludeFromIndexes: ['fullName', 'imageURL', 'verifiedAt'],
})

export const toUser = (data: any): User => ({
  id: getID(data),
  email: data.email,
  fullName: data.fullName,
  imageURL: data.imageURL,
  isAdmin: data.isAdmin,
})

type UserWithVerifiedAt = User & { verifiedAt?: Date }

const toUserWithVerifiedAt = (data: any, includeVerifiedAt: boolean): UserWithVerifiedAt | undefined =>
  data ? { ...toUser(data), verifiedAt: includeVerifiedAt ? data.verifiedAt : undefined } : undefined

export async function getUser(userID: number, includeVerifiedAt = false) {
  const userData = await getKeyedEntity(Entity.USER, userID)
  return toUserWithVerifiedAt(userData, includeVerifiedAt)
}

export async function getUserForEmail(email: string, includeVerifiedAt = false) {
  const userData = await getEntity(Entity.USER, 'email', email)
  return toUserWithVerifiedAt(userData, includeVerifiedAt)
}

export async function markUserLogin(userID: number, fullName: string, imageURL: string) {
  const userData = await getKeyedEntity(Entity.USER, userID)
  if (userData) {
    await getDatastore().save(
      toUserData(
        userData.email,
        fullName.length ? fullName : userData.fullName,
        imageURL.length ? imageURL : userData.imageURL,
        userData.isAdmin,
        userData.createdAt,
        new Date(),
        userData.verifiedAt,
        userID
      )
    )
  }
  return userData ? toUser(userData) : undefined
}

export async function saveUser(email: string, isAdmin: boolean, verifiedAt?: Date): Promise<number> {
  const previousUserData = await getEntity(Entity.USER, 'email', email)
  const userData = toUserData(
    email.toLowerCase(),
    email.toLowerCase(),
    '',
    isAdmin,
    previousUserData?.createdAt ?? new Date(),
    previousUserData?.lastLoginAt,
    verifiedAt,
    previousUserData ? getID(previousUserData) : undefined
  )
  await getDatastore().save(userData)
  if (!previousUserData) {
    await addProjectForUser(getID(userData), email.split('@')[0], true)
  }
  return getID(userData)
}
