import { Datastore, Key, PropertyFilter, Query } from '@google-cloud/datastore'
import { AggregateQuery } from '@google-cloud/datastore/build/src/aggregate'
import { EntityFilter } from '@google-cloud/datastore/build/src/filter'
import { updatePrompt } from './prompts'

export async function runDataMigration() {
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await updatePrompt(promptData)
  }
}

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
}

export const toID = ({ key }: { key: Key }) => Number(key.id)

const getKey = (entity: any) => entity[getDatastore().KEY] as Key

export const getID = (entity: any) => toID({ key: getKey(entity) })

export const getTimestamp = (entity: any, key = 'createdAt') => (entity[key] as Date)?.toISOString()

export const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

export const buildFilter = (key: string, value: {} | null) => new PropertyFilter(key, '=', value)

const projectQuery = (query: Query, keysOnly: boolean) => (keysOnly ? query.select('__key__') : query)

const orderQuery = (query: Query, sortKey: string | undefined) =>
  sortKey ? query.order(sortKey, { descending: true }) : query

const buildQuery = (
  type: string,
  filter: EntityFilter,
  limit: number,
  sortKey: string | undefined,
  keysOnly: boolean
) => projectQuery(orderQuery(getDatastore().createQuery(type).filter(filter).limit(limit), sortKey), keysOnly)

const getFilteredEntities = (
  type: string,
  filter: EntityFilter,
  limit = 100,
  sortKey: string | undefined = undefined,
  keysOnly = false
) =>
  getDatastore()
    .runQuery(buildQuery(type, filter, limit, sortKey, keysOnly))
    .then(([entities]) => entities)

export const getFilteredEntity = (type: string, filter: EntityFilter) =>
  getFilteredEntities(type, filter, 1).then(([entity]) => entity)

const getEntities = (type: string, key: string, value: {} | null, limit?: number, sortKey?: string) =>
  getFilteredEntities(type, buildFilter(key, value), limit, sortKey)

export const getOrderedEntities = (
  type: string,
  key: string,
  value: {} | null,
  sortKey = 'createdAt',
  limit?: number
) => getEntities(type, key, value, limit, sortKey)

export const getEntity = async (type: string, key: string, value: {} | null, mostRecent = false) =>
  getEntities(type, key, value, 1, mostRecent ? 'createdAt' : undefined).then(([entity]) => entity)

export const getEntityKeys = (type: string, key: string, value: {} | null, limit?: number) =>
  getFilteredEntities(type, buildFilter(key, value), limit, undefined, true).then(entities => entities.map(getKey))

export const getEntityID = (type: string, key: string, value: {} | null) =>
  getEntityKeys(type, key, value, 1).then(([key]) => toID({ key }))

const getKeyedEntities = async (type: string, ids: number[]) =>
  getDatastore()
    .get(ids.map(id => buildKey(type, id)))
    .then(([entities]) => entities)

export const getKeyedEntity = async (type: string, id: number) =>
  getKeyedEntities(type, [id]).then(([entity]) => entity)

export const getEntityCount = async (type: string, key: string, value: {} | null) => {
  const datastore = getDatastore()
  const query = datastore.createQuery(type).filter(buildFilter(key, value))
  const [[{ count }]] = await datastore.runAggregationQuery(new AggregateQuery(query).count('count'))
  return count
}
