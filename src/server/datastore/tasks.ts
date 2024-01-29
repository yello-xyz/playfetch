import { Entity, buildKey, getDatastore, getID, getEntity } from './datastore'

export async function migrateTasks(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allTasks] = await datastore.runQuery(datastore.createQuery(Entity.TASK))
  for (const taskData of allTasks) {
    await updateTask({ ...taskData })
  }
}

export async function getTaskForIdentifier(
  identifier: string,
  markAsComplete = false
): Promise<{ userID: number; projectID: number; versionID: number; labels: string[] } | null> {
  const taskData = await getEntity(Entity.TASK, 'identifier', identifier)

  if (markAsComplete && taskData) {
    await updateTask({ ...taskData, completedAt: new Date() })
  }

  return taskData
    ? {
        userID: taskData.userID,
        projectID: taskData.projectID,
        versionID: taskData.versionID,
        labels: JSON.parse(taskData.labels),
      }
    : null
}

async function updateTask(taskData: any) {
  await getDatastore().save(
    toTaskData(
      taskData.userID,
      taskData.projectID,
      taskData.versionID,
      taskData.identifier,
      JSON.parse(taskData.labels),
      taskData.createdAt,
      taskData.completedAt,
      getID(taskData)
    )
  )
}

export const saveNewTask = (
  userID: number,
  projectID: number,
  versionID: number,
  identifier: string,
  labels: string[]
) => getDatastore().save(toTaskData(userID, projectID, versionID, identifier, labels, new Date(), null))

const toTaskData = (
  userID: number,
  projectID: number,
  versionID: number,
  identifier: string,
  labels: string[],
  createdAt: Date,
  completedAt: Date | null,
  taskID?: number
) => ({
  key: buildKey(Entity.TASK, taskID),
  data: { userID, projectID, versionID, identifier, createdAt, completedAt, labels: JSON.stringify(labels) },
  excludeFromIndexes: ['labels'],
})
