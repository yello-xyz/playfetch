import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getID,
  runTransactionWithExponentialBackoff,
} from './datastore'
import { InputValues } from '@/types'
import { ensurePromptOrChainAccess } from './chains'

export async function migrateInputs() {
  const datastore = getDatastore()
  const [allInputs] = await datastore.runQuery(datastore.createQuery(Entity.INPUT))
  for (const inputData of allInputs) {
    await datastore.save(
      toInputData(inputData.parentID, inputData.name, JSON.parse(inputData.values), getID(inputData))
    )
  }
}

const toInputData = (parentID: number, name: string, values: string[], inputID?: number) => ({
  key: buildKey(Entity.INPUT, inputID),
  data: { parentID, name, values: JSON.stringify(values) },
  excludeFromIndexes: ['values'],
})

export async function saveInputValues(userID: number, parentID: number, name: string, values: string[]) {
  ensurePromptOrChainAccess(userID, parentID)
  await runTransactionWithExponentialBackoff(async transaction => {
    const query = transaction
      .createQuery(Entity.INPUT)
      .filter(and([buildFilter('parentID', parentID), buildFilter('name', name)]))
      .select('__key__')
      .limit(1)
    const [[inputKey]] = await transaction.runQuery(query)
    const inputID = inputKey ? getID(inputKey) : undefined
    transaction.save(toInputData(parentID, name, values, inputID))
  })
}

const toInput = (data: any): InputValues => ({ name: data.name, values: JSON.parse(data.values) })

export async function getTrustedParentInputValues(parentID: number) {
  const entities = await getEntities(Entity.INPUT, 'parentID', parentID)
  return Object.fromEntries(entities.map(toInput).map(input => [input.name, input.values])) as InputValues
}
