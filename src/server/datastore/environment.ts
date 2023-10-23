import { Entity, getDatastore } from './datastore'

enum Key {
  LAST_PROCESSED_COMMENT_DATE = 'lastProcessedCommentDate',
}

const buildKey = (key: string) => getDatastore().key([Entity.ENVIRONMENT, key])

async function loadFromEnvironment(key: Key) {
  const [environmentData] = await getDatastore().get(buildKey(key))
  return environmentData?.value
}

const saveToEnvironment = <T>(key: Key, value: T) =>
  getDatastore().save({ key: buildKey(key), excludeFromIndexes: ['value'], data: { value } })

export const getLastProcessedCommentDate = (): Promise<Date | undefined> =>
  loadFromEnvironment(Key.LAST_PROCESSED_COMMENT_DATE)

export const saveLastProcessedCommentDate = (date: Date) => saveToEnvironment(Key.LAST_PROCESSED_COMMENT_DATE, date)
