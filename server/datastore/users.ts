import { User } from '@/types'
import { Entity, buildKey, getDatastore, getEntity, getID, getTimestamp } from './datastore'

const toUserData = (email: string, isAdmin: boolean, createdAt: Date, lastLoginAt?: Date, userID?: number) => ({
  key: buildKey(Entity.USER, userID),
  data: { email, isAdmin, createdAt, lastLoginAt },
})

const toUser = (data: any): User => ({
  id: getID(data),
  email: data.email,
  isAdmin: data.isAdmin,
  timestamp: getTimestamp(data),
  lastLoginAt: getTimestamp(data, 'lastLoginAt'),
})

export async function markUserLogin(userID: number): Promise<User | undefined> {
  const datastore = getDatastore()
  const [userData] = await datastore.get(buildKey(Entity.USER, userID))
  if (userData) {
    await datastore.save(toUserData(userData.email, userData.isAdmin, userData.createdAt, new Date(), userID))
  }
  return userData ? toUser(userData) : undefined
}

export async function getUserForEmail(email: string): Promise<User | undefined> {
  const userData = await getEntity(Entity.USER, 'email', email)
  return userData ? toUser(userData) : undefined
}

export async function saveUser(email: string, isAdmin: boolean) {
  const userData = await getEntity(Entity.USER, 'email', email)
  await getDatastore().save(
    toUserData(email, isAdmin, userData?.createdAt ?? new Date(), userData?.lastLoginAt, userData?.id)
  )
}
