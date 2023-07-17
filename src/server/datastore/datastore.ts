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

export const getProjectID = async () => getDatastore().getProjectId()

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
  COMMENT = 'comment',
  PROVIDER = 'provider',
  CHAIN = 'chain',
}

const getKey = (entity: any) => entity[getDatastore().KEY] as Key

export const getID = (entity: any) => Number((entity.key ?? getKey(entity)).id)

export const getTimestamp = (entity: any, key = 'createdAt') => (entity[key] as Date)?.toISOString()

export const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

export const buildFilter = (key: string, value: {}) => new PropertyFilter(key, '=', value)

const projectQuery = (query: Query, keysOnly: boolean) => (keysOnly ? query.select('__key__') : query)

const orderQuery = (query: Query, sortKeys: string[]) =>
  sortKeys.reduce((q, sortKey) => q.order(sortKey, { descending: true }), query)

const buildQuery = (type: string, filter: EntityFilter, limit: number, sortKeys: string[], keysOnly: boolean) =>
  projectQuery(orderQuery(getDatastore().createQuery(type).filter(filter).limit(limit), sortKeys), keysOnly)

export const getFilteredEntities = (
  type: string,
  filter: EntityFilter,
  limit = 100,
  sortKeys = [] as string[],
  keysOnly = false
) =>
  getDatastore()
    .runQuery(buildQuery(type, filter, limit, sortKeys, keysOnly))
    .then(([entities]) => entities)

export const getFilteredEntity = (type: string, filter: EntityFilter) =>
  getFilteredEntities(type, filter, 1).then(([entity]) => entity)

export const getFilteredEntityKey = (type: string, filter: EntityFilter) =>
  getFilteredEntities(type, filter, 1, [], true).then(([entity]) => (entity ? getKey(entity) : undefined))

export const getEntities = (type: string, key: string, value: {}, limit?: number, sortKey?: string[]) =>
  getFilteredEntities(type, buildFilter(key, value), limit, sortKey)

export const getOrderedEntities = (type: string, key: string, value: {}, sortKeys = ['createdAt'], limit?: number) =>
  getEntities(type, key, value, limit, sortKeys)

export const getEntity = async (type: string, key: string, value: {}, mostRecent = false) =>
  getEntities(type, key, value, 1, mostRecent ? ['createdAt'] : []).then(([entity]) => entity)

export const getEntityKeys = (type: string, key: string, value: {}, limit?: number) =>
  getFilteredEntities(type, buildFilter(key, value), limit, undefined, true).then(entities => entities.map(getKey))

export const getEntityKey = (type: string, key: string, value: {}) =>
  getFilteredEntity(type, buildFilter(key, value)).then(getKey)

export const getEntityID = (type: string, key: string, value: {}) =>
  getEntityKeys(type, key, value, 1).then(([key]) => getID({ key }))

export const getKeyedEntities = async (type: string, ids: number[]): Promise<any[]> =>
  ids.length
    ? getDatastore()
        .get(ids.map(id => buildKey(type, id)))
        .then(([entities]) => entities)
    : Promise.resolve([])

export const getKeyedEntity = async (type: string, id: number) =>
  getKeyedEntities(type, [id]).then(([entity]) => entity)

export const getEntityCount = async (type: string, key: string, value: {}) => {
  const datastore = getDatastore()
  const query = datastore.createQuery(type).filter(buildFilter(key, value))
  const [[{ count }]] = await datastore.runAggregationQuery(new AggregateQuery(query).count('count'))
  return count
}

export const runTransactionWithExponentialBackoff = async (
  operation: (transaction: Transaction) => Promise<void>,
  maxTries: number = 10,
  currentAttempt: number = 1,
  milliseconds: number = 100
) => {
  const transaction = getDatastore().transaction()
  try {
    await transaction.run()
    await operation(transaction)
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    if (currentAttempt < maxTries) {
      new Promise(resolve => setTimeout(resolve, milliseconds)).then(() =>
        runTransactionWithExponentialBackoff(operation, maxTries, currentAttempt + 1, milliseconds * 2)
      )
    } else {
      throw error
    }
  }
}
