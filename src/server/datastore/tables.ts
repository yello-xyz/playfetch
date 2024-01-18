import { Entity, buildKey, getDatastore, getEntities, getEntityKey, getID } from './datastore'
import { InputValues, Table } from '@/types'
import { ensureProjectAccess, updateProjectLastEditedAt } from './projects'
import { getTrustedParentInputValues } from './inputs'
import { deleteEntity } from './cleanup'
import { getUniqueName, getVerifiedProjectScopedData } from './prompts'

export async function migrateTables(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allTables] = await datastore.runQuery(datastore.createQuery(Entity.TABLE))
  for (const tableData of allTables) {
    await updateTable(tableData)
  }
}

const updateTable = (tableData: any) =>
  getDatastore().save(toTableData(tableData.projectID, tableData.name, tableData.createdAt, getID(tableData)))

const toTableData = (projectID: number, name: string, createdAt: Date, tableID?: number) => ({
  key: buildKey(Entity.TABLE, tableID),
  data: { projectID, name, createdAt },
  excludeFromIndexes: ['name'],
})

export const toTable = (data: any): Table => ({
  id: getID(data),
  name: data.name,
  projectID: data.projectID,
})

export async function getTableForUser(
  userID: number,
  tableID: number
): Promise<{ table: Table; inputValues: InputValues }> {
  const tableData = await getVerifiedUserTableData(userID, tableID)
  const inputValues = await getTrustedParentInputValues(tableID)
  return { table: toTable(tableData), inputValues }
}

const DefaultTableName = 'New Test Data'

export async function addTableForUser(userID: number, projectID: number, name = DefaultTableName) {
  await ensureProjectAccess(userID, projectID)
  const tableNames = await getEntities(Entity.TABLE, 'projectID', projectID)
  const uniqueName = await getUniqueName(
    name,
    tableNames.map(table => table.name)
  )
  const tableData = toTableData(projectID, uniqueName, new Date())
  await getDatastore().save(tableData)
  updateProjectLastEditedAt(projectID)
  return getID(tableData)
}

export const getVerifiedUserTableData = async (userID: number, tableID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.TABLE], tableID)

const ensureTableAccess = (userID: number, tableID: number) => getVerifiedUserTableData(userID, tableID)

export async function updateTableName(userID: number, tableID: number, name: string) {
  const tableData = await getVerifiedUserTableData(userID, tableID)
  await updateTable({ ...tableData, name })
}

export async function deleteTableForUser(userID: number, tableID: number) {
  await ensureTableAccess(userID, tableID)
  const anyPromptKey = await getEntityKey(Entity.PROMPT, 'tableID', tableID)
  const anyChainKey = await getEntityKey(Entity.CHAIN, 'tableID', tableID)
  if (anyPromptKey || anyChainKey) {
    throw new Error('Cannot delete table that is linked to prompt or chain')
  }
  await deleteEntity(Entity.TABLE, tableID)
}
