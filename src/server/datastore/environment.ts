import { Entity, getDatastore } from './datastore'

enum Key {
  LAST_PROCESSED_COMMENT_TIMESTAMP = 'lastProcessedCommentTimestamp',
}

const buildKey = (key: string) => getDatastore().key([Entity.ENVIRONMENT, key])

async function loadFromEnvironment(key: Key) {
  const [environmentData] = await getDatastore().get(buildKey(key))
  return environmentData?.value
}

const saveToEnvironment = <T>(key: Key, value: T) =>
  getDatastore().save({ key: buildKey(key), excludeFromIndexes: ['value'], data: { value } })

export const getLastProcessedCommentTimestamp = (): Promise<number | undefined> =>
  loadFromEnvironment(Key.LAST_PROCESSED_COMMENT_TIMESTAMP)

export const updateLastProcessedCommentTimestamp = (timestamp: number) =>
  saveToEnvironment(Key.LAST_PROCESSED_COMMENT_TIMESTAMP, timestamp)
