import { Datastore, Key, PropertyFilter, Query, Transaction } from '@google-cloud/datastore'
import { AggregateQuery } from '@google-cloud/datastore/build/src/aggregate'
import { EntityFilter } from '@google-cloud/datastore/build/src/filter'

let datastore: Datastore
export const getDatastore = () => {
  if (!datastore) {
    datastore = new Datastore()
  }
  return datastore
}

export enum Entity {
  USER = 'user',
  PROJECT = 'project',
  PROMPT = 'prompt',
  VERSION = 'version',
  RUN = 'run',
  ENDPOINT = 'endpoint',
  CACHE = 'cache',
  ACCESS = 'access',
  INPUT = 'input',
  USAGE = 'usage',
  LOG = 'log',
  COMMENT = 'comment',
  PROVIDER = 'provider',
  CHAIN = 'chain',
  WORKSPACE = 'workspace',
}

const getKey = (entity: any) => entity[getDatastore().KEY] as Key

export const getID = (entity: any) => Number((entity.key ?? getKey(entity)).id)

export const getTimestamp = (entity: any, key = 'createdAt') => (entity[key] as Date)?.getTime()

export const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

export const buildFilter = (key: string, value: {}) => new PropertyFilter(key, '=', value)

const projectQuery = (query: Query, keys: string[]) => (keys.length > 0 ? query.select(keys) : query)

const orderQuery = (query: Query, sortKeys: string[]) =>
  sortKeys.reduce((q, sortKey) => q.order(sortKey, { descending: true }), query)

const buildQuery = (
  type: string,
  filter: EntityFilter,
  limit: number,
  sortKeys: string[],
  selectKeys: string[],
  transaction?: Transaction
) =>
  projectQuery(
    orderQuery((transaction ?? getDatastore()).createQuery(type).filter(filter).limit(limit), sortKeys),
    selectKeys
  )

const getInternalFilteredEntities = (
  type: string,
  filter: EntityFilter,
  limit = 100,
  sortKeys = [] as string[],
  selectKeys = [] as string[],
  transaction?: Transaction
) =>
  (transaction ?? getDatastore())
    .runQuery(buildQuery(type, filter, limit, sortKeys, selectKeys))
    .then(([entities]) => entities)

export const getFilteredEntities = (type: string, filter: EntityFilter, limit?: number) =>
  getInternalFilteredEntities(type, filter, limit)

export const getFilteredEntity = (type: string, filter: EntityFilter, transaction?: Transaction) =>
  getInternalFilteredEntities(type, filter, 1, [], [], transaction).then(([entity]) => entity)

const getInternalEntities = (
  type: string,
  key: string,
  value: {},
  limit?: number,
  sortKeys?: string[],
  transaction?: Transaction
) => getInternalFilteredEntities(type, buildFilter(key, value), limit, sortKeys, [], transaction)

export const getEntities = (type: string, key: string, value: {}, transaction?: Transaction) =>
  getInternalEntities(type, key, value, undefined, [], transaction)

export const getOrderedEntities = (type: string, key: string, value: {}, sortKeys = ['createdAt'], limit?: number) =>
  getInternalEntities(type, key, value, limit, sortKeys)

export const getEntity = async (type: string, key: string, value: {}, mostRecent = false) =>
  getInternalEntities(type, key, value, 1, mostRecent ? ['createdAt'] : []).then(([entity]) => entity)

const getFilteredEntityKeys = (type: string, filter: EntityFilter, limit?: number, transaction?: Transaction) =>
  getInternalFilteredEntities(type, filter, limit, [], ['__key__'], transaction).then(entities => entities.map(getKey))

export const getFilteredEntityKey = (type: string, filter: EntityFilter, transaction?: Transaction) =>
  getFilteredEntityKeys(type, filter, 1, transaction).then(([key]) => key)

export const getEntityKeys = (type: string, key: string, value: {}, limit?: number) =>
  getFilteredEntityKeys(type, buildFilter(key, value), limit)

export const getEntityKey = (type: string, key: string, value: {}) =>
  getEntityKeys(type, key, value, 1).then(([key]) => key)

const getFilteredEntityIDs = (type: string, filter: EntityFilter, limit?: number) =>
  getFilteredEntityKeys(type, filter, limit).then(keys => keys.map(key => getID({ key })))

export const getFilteredEntityID = (type: string, filter: EntityFilter) =>
  getFilteredEntityIDs(type, filter, 1).then(([id]) => id)

export const getEntityIDs = (type: string, key: string, value: {}, limit?: number) =>
  getFilteredEntityIDs(type, buildFilter(key, value), limit)

export const getEntityID = (type: string, key: string, value: {}) =>
  getEntityIDs(type, key, value, 1).then(([id]) => id)

export const getKeyedEntities = async (type: string, ids: number[], transaction?: Transaction): Promise<any[]> =>
  ids.length
    ? (transaction ?? getDatastore()).get(ids.map(id => buildKey(type, id))).then(([entities]) => entities)
    : Promise.resolve([])

export const getKeyedEntity = async (type: string, id: number, transaction?: Transaction) =>
  getKeyedEntities(type, [id], transaction).then(([entity]) => entity)

export const getEntityCount = async (type: string, key: string, value: {}) => {
  const datastore = getDatastore()
  const query = datastore.createQuery(type).filter(buildFilter(key, value))
  const [[{ count }]] = await datastore.runAggregationQuery(new AggregateQuery(query).count('count'))
  return count
}

export const allocateID = async (type: string, transaction?: Transaction) => {
  const [[key]] = await (transaction ?? getDatastore()).allocateIds(buildKey(type), 1)
  return getID({ key })
}

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
