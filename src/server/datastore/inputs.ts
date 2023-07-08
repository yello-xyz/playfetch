import { and } from '@google-cloud/datastore'
import { Entity, buildFilter, buildKey, getDatastore, getEntities, getFilteredEntityKey, getID } from './datastore'
import { ensureProjectAccess } from './projects'
import { InputValues } from '@/types'

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
  await getDatastore().save(toInputData(projectID, name, values, key ? getID({ key }) : undefined))
}

const toInput = (data: any): InputValues => ({ name: data.name, values: JSON.parse(data.values) })

export async function getProjectInputValues(projectID: number) {
  const entities = await getEntities(Entity.INPUT, 'projectID', projectID)
  return Object.fromEntries(entities.map(toInput).map(input => [input.name, input.values])) as InputValues
}
