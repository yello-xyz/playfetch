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
import { getVerifiedProjectScopedData } from './prompts'
import { addTableForUser } from './tables'

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

const toInputData = (parentID: number, name: string, values: string[], createdAt: Date, inputID?: number) =>
  toRawInputData(parentID, name, JSON.stringify(values), createdAt, inputID)

const toRawInputData = (parentID: number, name: string, values: string, createdAt: Date, inputID?: number) => ({
  key: buildKey(Entity.INPUT, inputID),
  data: { parentID, createdAt, name, values },
  excludeFromIndexes: ['values'],
})

export async function saveInputValues(userID: number, parentID: number, name: string, values: string[] | undefined) {
  await getVerifiedProjectScopedData(userID, [Entity.PROMPT, Entity.CHAIN, Entity.TABLE], parentID)
  await runTransactionWithExponentialBackoff(async transaction => {
    const key = await getFilteredEntityKey(
      Entity.INPUT,
      and([buildFilter('parentID', parentID), buildFilter('name', name)]),
      transaction
    )
    if (values !== undefined) {
      const inputID = key ? getID({ key }) : undefined
      transaction.save(toInputData(parentID, name, values, new Date(), inputID))
    } else if (key) {
      transaction.delete(key)
    }
  })
}

const toInput = (data: any): InputValues => ({ name: data.name, values: JSON.parse(data.values) })

export async function getTrustedParentInputValues(parentID: number) {
  const entities = await getEntities(Entity.INPUT, 'parentID', parentID)
  return Object.fromEntries(entities.map(toInput).map(input => [input.name, input.values])) as InputValues
}

export async function relinkInputValues(
  userID: number,
  parentID: number,
  tableID: number | null | undefined,
  getParentData: (userID: number, parentID: number) => Promise<any>,
  updateParentData: (parentData: any) => Promise<void>
) {
  const parentData = await getParentData(userID, parentID)
  if (!parentData.tableID) {
    if (tableID === undefined) {
      tableID = await addTableForUser(userID, parentData.projectID)
      await reparentInputValues(parentID, tableID)
    } else {
      await deleteInputValues(parentID)
    }
  }
  tableID = tableID ?? undefined
  if (tableID !== parentData.tableID) {
    await updateParentData({ ...parentData, tableID })
  }
  return tableID ?? null
}

const reparentInputValues = (oldParentID: number, newParentID: number) =>
  runTransactionWithExponentialBackoff(async transaction => {
    const inputs = await getEntities(Entity.INPUT, 'parentID', oldParentID, transaction)
    inputs.forEach(input => {
      input.parentID = newParentID
    })
    transaction.save(
      inputs.map(inputData =>
        toRawInputData(newParentID, inputData.name, inputData.values, inputData.createdAt, getID(inputData))
      )
    )
  })

const deleteInputValues = (parentID: number) =>
  runTransactionWithExponentialBackoff(async transaction => {
    const inputs = await getEntities(Entity.INPUT, 'parentID', parentID, transaction)
    transaction.delete(inputs.map(input => buildKey(Entity.INPUT, getID(input))))
  })
