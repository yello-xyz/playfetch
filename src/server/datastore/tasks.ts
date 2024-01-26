import { Entity, buildKey, getDatastore, getID, getEntity } from './datastore'

export async function migrateTasks(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allTasks] = await datastore.runQuery(datastore.createQuery(Entity.TASK))
  for (const taskData of allTasks) {
    await getDatastore().save(
      toTaskData(
        taskData.userID,
        taskData.projectID,
        taskData.versionID,
        taskData.identifier,
        taskData.createdAt,
        JSON.parse(taskData.labels),
        getID(taskData)
      )
    )
  }
}

export async function getTaskForIdentifier(
  identifier: string
): Promise<{ userID: number; projectID: number; versionID: number; labels: string[] } | null> {
  const taskData = await getEntity(Entity.TASK, 'identifier', identifier)

  return taskData
    ? {
        userID: taskData.userID,
        projectID: taskData.projectID,
        versionID: taskData.versionID,
        labels: JSON.parse(taskData.labels),
      }
    : null
}

export const saveTask = (userID: number, projectID: number, versionID: number, identifier: string, labels: string[]) =>
  getDatastore().save(toTaskData(userID, projectID, versionID, identifier, new Date(), labels))

const toTaskData = (
  userID: number,
  projectID: number,
  versionID: number,
  identifier: string,
  createdAt: Date,
  labels: string[],
  taskID?: number
) => ({
  key: buildKey(Entity.TASK, taskID),
  data: { userID, projectID, versionID, identifier, createdAt, labels: JSON.stringify(labels) },
  excludeFromIndexes: ['labels'],
})
