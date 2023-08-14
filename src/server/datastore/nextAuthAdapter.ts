import { Adapter } from 'next-auth/adapters'
import {
  buildFilter,
  buildKey,
  getDatastore,
  getEntity,
  getEntityKeys,
  getFilteredEntity,
  getID,
  getKeyedEntity,
} from './datastore'
import { and } from '@google-cloud/datastore'

enum Entity {
  USER = '_nextauth_user',
  ACCOUNT = '_nextauth_account',
  TOKEN = '_nextauth_token',
}

export default function NextAuthAdapter(): Adapter {
  const getAccount = async (providerAccountId: string, provider: string) => {
    const datastore = getDatastore()
    const query = datastore
      .createQuery(Entity.ACCOUNT)
      .filter(and([buildFilter('provider', provider), buildFilter('providerAccountId', providerAccountId)]))
      .order('expires_at', { descending: true })
      .limit(1)
    const [[account]] = await datastore.runQuery(query)
    return account
  }

  return {
    async createUser({ email, emailVerified }: { email: string; emailVerified: Date | null }) {
      const userData = {
        key: buildKey(Entity.USER),
        data: { email, emailVerified },
        excludeFromIndexes: ['emailVerified'],
      }
      await getDatastore().save(userData)
      return { id: getID(userData).toString(), email, emailVerified }
    },
    async getUser(id: string) {
      const user = await getKeyedEntity(Entity.USER, Number(id))
      return user ? { id, email: user.email, emailVerified: user.emailVerified } : null
    },
    async getUserByEmail(email) {
      const user = await getEntity(Entity.USER, 'email', email)
      return user ? { id: getID(user).toString(), email: user.email, emailVerified: user.emailVerified } : null
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await getAccount(providerAccountId, provider)
      if (!account) {
        return null
      }
      const user = await getKeyedEntity(Entity.USER, Number(account.userId))
      return user ? { id: getID(user).toString(), email: user.email, emailVerified: user.emailVerified } : null
    },
    async updateUser(user) {
      const existingUser = await getKeyedEntity(Entity.USER, Number(user.id))
      if (!existingUser) {
        throw new Error('User not found')
      }
      const email = user.email ?? existingUser.email
      const emailVerified = user.emailVerified ?? existingUser.emailVerified
      await getDatastore().save({
        key: buildKey(Entity.USER, Number(user.id)),
        data: { email, emailVerified },
        excludeFromIndexes: ['emailVerified'],
      })
      return { id: user.id, email, emailVerified }
    },
    async deleteUser(userId) {
      const accountKeys = await getEntityKeys(Entity.ACCOUNT, 'userId', userId)
      await getDatastore().delete([...accountKeys, buildKey(Entity.USER, Number(userId))])
    },
    async linkAccount(account) {
      await getDatastore().save({
        key: buildKey(Entity.ACCOUNT),
        data: account,
        excludeFromIndexes: [
          'type',
          'refresh_token',
          'access_token',
          'token_type',
          'scope',
          'id_token',
          'session_state',
        ],
      })
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const account = await getAccount(providerAccountId, provider)
      await getDatastore().delete(buildKey(Entity.ACCOUNT, getID(account)))
    },
    async createVerificationToken({ identifier, expires, token }) {
      await getDatastore().save({
        key: buildKey(Entity.TOKEN),
        data: { identifier, expires, token },
        excludeFromIndexes: [],
      })
      return { identifier, expires, token }
    },
    async useVerificationToken({ identifier, token }) {
      const filter = and([buildFilter('identifier', identifier), buildFilter('token', token)])
      const tokenData = await getFilteredEntity(Entity.TOKEN, filter)
      await getDatastore().delete(buildKey(Entity.TOKEN, getID(tokenData)))
      return { identifier: tokenData.identifier, token: tokenData.token, expires: tokenData.expires }
    },
  }
}
