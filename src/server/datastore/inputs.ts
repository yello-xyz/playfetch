import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getFilteredEntityKey,
  getID,
  runTransactionWithExponentialBackoff,
} from './datastore'
import { InputValues } from '@/types'
import { ensurePromptOrChainAccess } from './chains'

export async function migrateInputs(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allInputs] = await datastore.runQuery(datastore.createQuery(Entity.INPUT))
  for (const inputData of allInputs) {
    await datastore.save(
      toInputData(
        inputData.parentID,
        inputData.name,
        JSON.parse(inputData.values),
        inputData.createdAt,
        getID(inputData)
      )
    )
  }
}

const toInputData = (parentID: number, name: string, values: string[], createdAt: Date, inputID?: number) => ({
  key: buildKey(Entity.INPUT, inputID),
  data: { parentID, createdAt, name, values: JSON.stringify(values) },
  excludeFromIndexes: ['values'],
})

export async function saveInputValues(userID: number, parentID: number, name: string, values: string[]) {
  ensurePromptOrChainAccess(userID, parentID)
  await runTransactionWithExponentialBackoff(async transaction => {
    const key = await getFilteredEntityKey(
      Entity.INPUT,
      and([buildFilter('parentID', parentID), buildFilter('name', name)]),
      transaction
    )
    const inputID = key ? getID({ key }) : undefined
    transaction.save(toInputData(parentID, name, values, new Date(), inputID))
  })
}

const toInput = (data: any): InputValues => ({ name: data.name, values: JSON.parse(data.values) })

export async function getTrustedParentInputValues(parentID: number) {
  const entities = await getEntities(Entity.INPUT, 'parentID', parentID)
  return Object.fromEntries(entities.map(toInput).map(input => [input.name, input.values])) as InputValues
}
