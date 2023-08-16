import { and } from '@google-cloud/datastore'
import { Entity, buildFilter, buildKey, getDatastore, getEntities, getFilteredEntityID, getID } from './datastore'
import { ensureProjectAccess } from './projects'
import { InputValues } from '@/types'

export async function migrateInputs() {
  const datastore = getDatastore()
  const [allInputs] = await datastore.runQuery(datastore.createQuery(Entity.ACCESS))
  for (const inputData of allInputs) {
    await datastore.save(
      toInputData(
        inputData.projectID,
        inputData.parentID,
        inputData.name,
        JSON.parse(inputData.values),
        getID(inputData)
      )
    )
  }
}

const toInputData = (projectID: number, parentID: number, name: string, values: string[], inputID?: number) => ({
  key: buildKey(Entity.INPUT, inputID),
  data: { projectID, parentID, name, values: JSON.stringify(values) },
  excludeFromIndexes: ['values'],
})

export async function saveInputValues(
  userID: number,
  projectID: number,
  parentID: number,
  name: string,
  values: string[]
) {
  await ensureProjectAccess(userID, projectID)
  const inputID = await getFilteredEntityID(
    Entity.INPUT,
    and([buildFilter('parentID', parentID), buildFilter('name', name)])
  )
  await getDatastore().save(toInputData(projectID, parentID, name, values, inputID))
}

const toInput = (data: any): InputValues => ({ name: data.name, values: JSON.parse(data.values) })

export async function getProjectInputValues(projectID: number) {
  const entities = await getEntities(Entity.INPUT, 'projectID', projectID)
  return Object.fromEntries(entities.map(toInput).map(input => [input.name, input.values])) as InputValues
}
