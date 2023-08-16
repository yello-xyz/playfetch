import { and } from '@google-cloud/datastore'
import { Entity, buildFilter, buildKey, getDatastore, getEntities, getFilteredEntityID, getID } from './datastore'
import { InputValues } from '@/types'
import { ensurePromptAccess } from './prompts'
import { ensureChainAccess } from './chains'

export async function migrateInputs() {
  const datastore = getDatastore()
  const [allInputs] = await datastore.runQuery(datastore.createQuery(Entity.ACCESS))
  for (const inputData of allInputs) {
    await datastore.save(
      toInputData(
        inputData.parentID,
        inputData.name,
        JSON.parse(inputData.values),
        getID(inputData)
      )
    )
  }
}

const toInputData = (parentID: number, name: string, values: string[], inputID?: number) => ({
  key: buildKey(Entity.INPUT, inputID),
  data: { parentID, name, values: JSON.stringify(values) },
  excludeFromIndexes: ['values'],
})

export async function saveInputValues(
  userID: number,
  parentID: number,
  parentType: 'prompt' | 'chain',
  name: string,
  values: string[]
) {
  switch (parentType) {
    case 'prompt':
      await ensurePromptAccess(userID, parentID)
      break
    case 'chain':
      await ensureChainAccess(userID, parentID)
      break
  }
  const inputID = await getFilteredEntityID(
    Entity.INPUT,
    and([buildFilter('parentID', parentID), buildFilter('name', name)])
  )
  await getDatastore().save(toInputData(parentID, name, values, inputID))
}

const toInput = (data: any): InputValues => ({ name: data.name, values: JSON.parse(data.values) })

export async function getTrustedParentInputValues(parentID: number) {
  const entities = await getEntities(Entity.INPUT, 'parentID', parentID)
  return Object.fromEntries(entities.map(toInput).map(input => [input.name, input.values])) as InputValues
}
