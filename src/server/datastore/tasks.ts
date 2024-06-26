import { and } from '@google-cloud/datastore'
import { Entity, buildKey, getDatastore, getID, getEntity, getFilteredEntities, buildFilter } from './datastore'

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
): Promise<{ userID: number; projectID: number; versionID: number } | null> {
  const taskData = await getEntity(Entity.TASK, 'identifier', identifier)

  if (markAsComplete && taskData) {
    await updateTask({ ...taskData, completedAt: new Date() })
  }

  return taskData
    ? {
        userID: taskData.userID,
        projectID: taskData.projectID,
        versionID: taskData.versionID,
      }
    : null
}

export async function getPendingTaskIdentifiersForVersion(versionID: number): Promise<string[]> {
  const taskData = await getFilteredEntities(
    Entity.TASK,
    and([buildFilter('versionID', versionID), buildFilter('completedAt', null)])
  )
  return taskData.map(task => task.identifier)
}

async function updateTask(taskData: any) {
  await getDatastore().save(
    toTaskData(
      taskData.userID,
      taskData.projectID,
      taskData.parentID,
      taskData.versionID,
      taskData.identifier,
      taskData.createdAt,
      taskData.completedAt,
      getID(taskData)
    )
  )
}

export const saveNewTask = (
  userID: number,
  projectID: number,
  parentID: number,
  versionID: number,
  identifier: string
) => getDatastore().save(toTaskData(userID, projectID, parentID, versionID, identifier, new Date(), null))

const toTaskData = (
  userID: number,
  projectID: number,
  parentID: number,
  versionID: number,
  identifier: string,
  createdAt: Date,
  completedAt: Date | null,
  taskID?: number
) => ({
  key: buildKey(Entity.TASK, taskID),
  data: { userID, projectID, parentID, versionID, identifier, createdAt, completedAt },
  excludeFromIndexes: [],
})
