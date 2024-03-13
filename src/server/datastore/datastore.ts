import { Datastore, Key, PropertyFilter, Query, Transaction } from '@google-cloud/datastore'
import { AggregateQuery } from '@google-cloud/datastore/build/src/aggregate'
import { EntityFilter, and } from '@google-cloud/datastore/build/src/filter'
import crypto from 'crypto'

let datastore: Datastore
export const getDatastore = () => {
  if (!datastore) {
    datastore = new Datastore({ fallback: 'rest' })
  }
  return datastore
}

export enum Entity {
  CLEANUP = 'cleanup',
  ENVIRONMENT = 'environment',
  USER = 'user',
  PROJECT = 'project',
  PROMPT = 'prompt',
  VERSION = 'version',
  RUN = 'run',
  ENDPOINT = 'endpoint',
  CACHE = 'cache',
  ACCESS = 'access',
  INPUT = 'input',
  COMMENT = 'comment',
  PROVIDER = 'provider',
  CHAIN = 'chain',
  WORKSPACE = 'workspace',
  LOG = 'log',
  USAGE = 'usage',
  ANALYTICS = 'analytics',
  COST = 'cost',
  BUDGET = 'budget',
  RATING = 'rating',
  TABLE = 'table',
  TASK = 'task',
}

export enum NextAuthEntity {
  USER = '_nextauth_user',
  ACCOUNT = '_nextauth_account',
  TOKEN = '_nextauth_token',
}

type EntityType = Entity | NextAuthEntity

const getKey = (entity: any) => entity[getDatastore().KEY] as Key

export const getID = (entity: any) => Number((entity.key ?? getKey(entity)).id)

export const getTimestamp = (entity: any, key = 'createdAt') => (entity[key] as Date)?.getTime()

export const buildKey = (type: EntityType, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

export const buildFilter = (key: string, value: {} | null) => new PropertyFilter(key, '=', value)

const filterQuery = (query: Query, filter: EntityFilter | undefined) =>
  filter !== undefined ? query.filter(filter) : query

const projectQuery = (query: Query, keys: string[]) => (keys.length > 0 ? query.select(keys) : query)

const orderQuery = (query: Query, sortKeys: string[]) =>
  sortKeys.reduce((q, sortKey) => q.order(sortKey, { descending: true }), query)

const cursorQuery = (query: Query, cursor: string | undefined) => (cursor ? query.start(cursor) : query)

const buildQuery = (
  type: EntityType,
  filter: EntityFilter | undefined,
  limit: number,
  cursor: string | undefined,
  sortKeys: string[],
  selectKeys: string[],
  transaction?: Transaction
) =>
  projectQuery(
    orderQuery(
      cursorQuery(filterQuery((transaction ?? getDatastore()).createQuery(type), filter).limit(limit), cursor),
      sortKeys
    ),
    selectKeys
  )

const defaultLimitForType = (type: EntityType) => {
  switch (type) {
    case Entity.PROMPT:
      return 250
    default:
      return 100
  }
}

const runQuery = (
  type: EntityType,
  filter: EntityFilter | undefined,
  limit: number,
  sortKeys: string[],
  selectKeys: string[],
  cursor: string | undefined,
  transaction: Transaction | undefined
) => (transaction ?? getDatastore()).runQuery(buildQuery(type, filter, limit, cursor, sortKeys, selectKeys))

export const getPagedEntities = (type: EntityType, key: string, value: {}, cursor: string | undefined) =>
  runQuery(type, buildFilter(key, value), defaultLimitForType(type), ['createdAt'], [], cursor, undefined).then(
    ([entities, info]) =>
      [entities, info.moreResults !== Datastore.NO_MORE_RESULTS ? info.endCursor : undefined] as const
  )

const getInternalFilteredEntities = (
  type: EntityType,
  filter?: EntityFilter,
  limit = defaultLimitForType(type),
  sortKeys = [] as string[],
  selectKeys = [] as string[],
  transaction?: Transaction
) => runQuery(type, filter, limit, sortKeys, selectKeys, undefined, transaction).then(([entities]) => entities)

export const afterDateFilter = (since: Date, key = 'createdAt', inclusive = false) =>
  new PropertyFilter(key, inclusive ? '>=' : '>', since)
export const beforeDateFilter = (before: Date, key = 'createdAt', inclusive = false) =>
  new PropertyFilter(key, inclusive ? '<=' : '<', before)
const dateFilter = (key: string, since?: Date, before?: Date, pagingBackwards = false) =>
  since && before
    ? and([afterDateFilter(since, key, !pagingBackwards), beforeDateFilter(before, key, pagingBackwards)])
    : since
      ? afterDateFilter(since, key, !pagingBackwards)
      : before
        ? beforeDateFilter(before, key, pagingBackwards)
        : undefined

export const getRecentEntities = (
  type: EntityType,
  limit?: number,
  since?: Date,
  before?: Date,
  sortKey = 'createdAt',
  pagingBackwards = false
) => getInternalFilteredEntities(type, dateFilter(sortKey, since, before, pagingBackwards), limit, [sortKey])

export const getFilteredEntities = (type: EntityType, filter: EntityFilter, limit?: number) =>
  getInternalFilteredEntities(type, filter, limit)

export const getFilteredEntity = (type: EntityType, filter: EntityFilter, transaction?: Transaction) =>
  getInternalFilteredEntities(type, filter, 1, [], [], transaction).then(([entity]) => entity)

const getInternalEntities = (
  type: EntityType,
  key: string,
  value: {},
  limit?: number,
  sortKeys?: string[],
  transaction?: Transaction
) => getInternalFilteredEntities(type, buildFilter(key, value), limit, sortKeys, [], transaction)

export const getEntities = (type: EntityType, key: string, value: {}, transaction?: Transaction) =>
  getInternalEntities(type, key, value, undefined, [], transaction)

export const getFilteredOrderedEntities = (
  type: EntityType,
  filter: EntityFilter,
  sortKeys = ['createdAt'],
  limit?: number
) => getInternalFilteredEntities(type, filter, limit, sortKeys, [])

export const getOrderedEntities = (
  type: EntityType,
  key: string,
  value: {},
  sortKeys = ['createdAt'],
  limit?: number
) => getFilteredOrderedEntities(type, buildFilter(key, value), sortKeys, limit)

export const getLastFilteredEntity = (type: EntityType, filter: EntityFilter) =>
  getFilteredOrderedEntities(type, filter, ['createdAt'], 1).then(([entity]) => entity)

export const getLastEntity = (type: EntityType, key: string, value: {}) =>
  getLastFilteredEntity(type, buildFilter(key, value))

export const getEntity = async (type: EntityType, key: string, value: {}) =>
  getInternalEntities(type, key, value, 1, []).then(([entity]) => entity)

const getFilteredEntityKeys = (type: EntityType, filter: EntityFilter, limit?: number, transaction?: Transaction) =>
  getInternalFilteredEntities(type, filter, limit, [], ['__key__'], transaction).then(entities => entities.map(getKey))

export const getFilteredEntityKey = (type: EntityType, filter: EntityFilter, transaction?: Transaction) =>
  getFilteredEntityKeys(type, filter, 1, transaction).then(([key]) => key)

export const getEntityKeys = (type: EntityType, key: string, value: {}, limit?: number) =>
  getFilteredEntityKeys(type, buildFilter(key, value), limit)

export const getEntityKey = (type: EntityType, key: string, value: {}) =>
  getEntityKeys(type, key, value, 1).then(([key]) => key)

const getFilteredEntityIDs = (type: EntityType, filter: EntityFilter, limit?: number) =>
  getFilteredEntityKeys(type, filter, limit).then(keys => keys.map(key => getID({ key })))

export const getFilteredEntityID = (type: EntityType, filter: EntityFilter) =>
  getFilteredEntityIDs(type, filter, 1).then(([id]) => id)

export const getKeyedEntities = async (type: EntityType, ids: number[], transaction?: Transaction): Promise<any[]> =>
  ids.length
    ? (transaction ?? getDatastore()).get(ids.map(id => buildKey(type, id))).then(([entities]) => entities)
    : Promise.resolve([])

export const getKeyedEntity = async (type: EntityType, id: number, transaction?: Transaction) =>
  getKeyedEntities(type, [id], transaction).then(([entity]) => entity)

export const getFilteredEntityCount = async (type: EntityType, filter: EntityFilter) => {
  const datastore = getDatastore()
  const query = datastore.createQuery(type).filter(filter)
  const [[{ count }]] = await datastore.runAggregationQuery(new AggregateQuery(query).count('count'))
  return count
}

export const getEntityCount = async (type: EntityType, key: string, value: {}) =>
  getFilteredEntityCount(type, buildFilter(key, value))

export const allocateIDs = (type: EntityType, count: number, transaction?: Transaction) =>
  (transaction ?? getDatastore()).allocateIds(buildKey(type), count).then(([keys]) => keys.map(key => getID({ key })))

export const allocateID = (type: EntityType, transaction?: Transaction) =>
  allocateIDs(type, 1, transaction).then(([id]) => id)

export const runTransactionWithExponentialBackoff = async <T>(
  operation: (transaction: Transaction) => Promise<T>,
  maxTries: number = 10,
  currentAttempt: number = 1,
  milliseconds: number = 100
): Promise<T> => {
  const transaction = getDatastore().transaction()
  try {
    await transaction.run()
    const result = await operation(transaction)
    await transaction.commit()
    return result
  } catch (error) {
    await transaction.rollback()
    if (currentAttempt < maxTries) {
      return new Promise(resolve => setTimeout(resolve, milliseconds)).then(() =>
        runTransactionWithExponentialBackoff(operation, maxTries, currentAttempt + 1, milliseconds * 2)
      )
    } else {
      throw error
    }
  }
}
