import { Adapter } from 'next-auth/adapters'
import { saveUser, getUser as getUserByID, getUserForEmail } from './users'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntity,
  getEntityKey,
  getEntityKeys,
  getFilteredEntity,
  getFilteredEntityKey,
  getID,
} from './datastore'
import { and } from '@google-cloud/datastore'

export default function NextAuthAdapter(): Adapter {
  const accountFilter = (providerAccountId: string, provider: string) =>
    and([buildFilter('provider', provider), buildFilter('providerAccountId', providerAccountId)])

  return {
    async createUser({ email, emailVerified }: { email: string; emailVerified: Date | null }) {
      const userId = await saveUser(email, false, emailVerified ?? undefined)
      return { email, emailVerified, id: userId.toString() }
    },
    async getUser(id: string) {
      const user = await getUserByID(Number(id), true)
      return user ? { email: user.email, emailVerified: user.verifiedAt ?? null, id: user.id.toString() } : null
    },
    async getUserByEmail(email) {
      const user = await getUserForEmail(email, true)
      return user ? { email: user.email, emailVerified: user.verifiedAt ?? null, id: user.id.toString() } : null
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await getFilteredEntity(Entity.ACCOUNT, accountFilter(providerAccountId, provider))
      const user = await getUserByID(Number(account.userId), true)
      return user ? { email: user.email, emailVerified: user.verifiedAt ?? null, id: user.id.toString() } : null
    },
    async updateUser(user) {
      const existingUser = await getUserByID(Number(user.id))
      if (!existingUser) {
        throw new Error('User not found')
      }
      const email = user.email ?? existingUser.email
      const emailVerified = user.emailVerified ?? existingUser.verifiedAt
      await saveUser(email, existingUser.isAdmin, emailVerified)
      return { id: user.id, email, emailVerified: emailVerified ?? null }
    },
    async deleteUser(userId) {
      const accountKeys = await getEntityKeys(Entity.ACCOUNT, 'userId', Number(userId))
      const sessionKeys = await getEntityKeys(Entity.SESSION, 'userId', Number(userId))
      // TODO delete user project and access keys?
      await getDatastore().delete([...accountKeys, ...sessionKeys, buildKey(Entity.USER, Number(userId))])
    },
    async linkAccount(account) {
      await getDatastore().save({
        key: buildKey(Entity.ACCOUNT),
        data: account,
        excludeFromIndexes: [
          'type',
          'refresh_token',
          'access_token',
          'expires_at',
          'token_type',
          'scope',
          'id_token',
          'session_state',
        ],
      })
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const accountKey = await getFilteredEntityKey(Entity.ACCOUNT, accountFilter(providerAccountId, provider))
      await getDatastore().delete(accountKey)
    },
    async createSession({ sessionToken, userId, expires }) {
      await getDatastore().save({
        key: buildKey(Entity.SESSION),
        data: { sessionToken, userId, expires },
        excludeFromIndexes: ['userId', 'expires'],
      })
      return { sessionToken, userId, expires }
    },
    async getSessionAndUser(sessionToken) {
      const session = await getEntity(Entity.SESSION, 'sessionToken', sessionToken)
      if (!session) {
        return null
      }
      const user = await getUserByID(Number(session.userId), true)
      if (!user) {
        throw new Error('User not found')
      }
      return {
        session: { sessionToken, userId: session.userId, expires: session.expires },
        user: { id: user.id.toString(), email: user.email, emailVerified: user.verifiedAt ?? null },
      }
    },
    async updateSession(session) {
      const sessionToken = session.sessionToken
      const existingSession = await getEntity(Entity.SESSION, 'sessionToken', sessionToken)
      if (!existingSession) {
        return null
      }
      const userId = session.userId ?? existingSession.userId
      const expires = session.expires ?? existingSession.expires
      await getDatastore().save({
        key: buildKey(Entity.SESSION, getID(existingSession)),
        data: { sessionToken, userId, expires },
        excludeFromIndexes: ['userId', 'expires'],
      })
      return { sessionToken, userId, expires }
    },
    async deleteSession(sessionToken) {
      const sessionKey = await getEntityKey(Entity.SESSION, 'sessionToken', sessionToken)
      await getDatastore().delete(sessionKey)
    },
    async createVerificationToken({ identifier, expires, token }) {
      await getDatastore().save({
        key: buildKey(Entity.TOKEN),
        data: { identifier, expires, token },
        excludeFromIndexes: ['expires'],
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
