import { User } from '@/types'
import { Entity, buildKey, getDatastore, getEntity, getID, getKeyedEntity, getTimestamp } from './datastore'

const toUserData = (
  email: string,
  fullName: string,
  avatarColor: string,
  isAdmin: boolean,
  createdAt: Date,
  lastLoginAt?: Date,
  userID?: number
) => ({
  key: buildKey(Entity.USER, userID),
  data: { email, fullName, avatarColor, isAdmin, createdAt, lastLoginAt },
  excludeFromIndexes: ['fullName', 'avatarColor'],
})

export const toUser = (data: any): User => ({
  id: getID(data),
  email: data.email,
  fullName: data.fullName,
  avatarColor: data.avatarColor,
  isAdmin: data.isAdmin,
})

export async function markUserLogin(userID: number, fullName: string, avatarColor: string): Promise<User | undefined> {
  const userData = await getKeyedEntity(Entity.USER, userID)
  if (userData) {
    await getDatastore().save(
      toUserData(
        userData.email,
        fullName.length ? fullName : userData.fullName,
        avatarColor.length ? avatarColor : userData.avatarColor,
        userData.isAdmin,
        userData.createdAt,
        new Date(),
        userID
      )
    )
  }
  return userData ? toUser(userData) : undefined
}

export async function getUserForEmail(email: string): Promise<User | undefined> {
  const userData = await getEntity(Entity.USER, 'email', email)
  return userData ? toUser(userData) : undefined
}

export async function saveUser(email: string, avatarColor: string, isAdmin: boolean) {
  const userData = await getEntity(Entity.USER, 'email', email)
  await getDatastore().save(
    toUserData(
      email.toLowerCase(),
      '',
      avatarColor,
      isAdmin,
      userData?.createdAt ?? new Date(),
      userData?.lastLoginAt,
      userData ? getID(userData) : undefined
    )
  )
}
