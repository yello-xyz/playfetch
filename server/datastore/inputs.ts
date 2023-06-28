import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getFilteredEntityKey,
  getID,
  toID,
} from './datastore'
import { ensureProjectAccess } from './projects'

const toInputData = (projectID: number, name: string, values: string[], inputID?: number) => ({
  key: buildKey(Entity.INPUT, inputID),
  data: { projectID, name, values: JSON.stringify(values) },
  excludeFromIndexes: ['values'],
})

export async function saveInputValues(userID: number, projectID: number, name: string, values: string[]) {
  await ensureProjectAccess(userID, projectID)
  const key = await getFilteredEntityKey(
    Entity.INPUT,
    and([buildFilter('projectID', projectID), buildFilter('name', name)])
  )
  await getDatastore().save(toInputData(projectID, name, values, key ? toID({ key }) : undefined))
}

export const toInput = (data: any) => ({
  id: getID(data),
  name: data.name,
  values: JSON.parse(data.values),
})

export async function getProjectInputValues(userID: number, projectID: number) {
  await ensureProjectAccess(userID, projectID)
  const entities = await getEntities(Entity.INPUT, 'projectID', projectID)
  return entities.map(toInput)
}
