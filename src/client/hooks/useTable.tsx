import api from '@/src/client/api'
import { TableRoute } from '@/src/common/clientRoute'
import { ActiveProject, ActiveTable, Table } from '@/types'
import { useRouter } from 'next/router'

export default function useTable(
  activeProject: ActiveProject,
  refreshProject: () => Promise<void>,
  activeTable: ActiveTable | undefined,
  setActiveTable: (table: ActiveTable) => void,
  savePrompt: (onSaved: () => Promise<void>) => void,
  clearVersion: () => void
) {
  const router = useRouter()

  const refreshTable = async (tableID: number) => {
    const newTable = await api.getTable(tableID)
    setActiveTable(newTable)
    clearVersion()
  }

  const selectTable = async (tableID: number) => {
    if (tableID !== activeTable?.id) {
      savePrompt(refreshProject)
      await refreshTable(tableID)
      router.push(TableRoute(activeProject.id, tableID), undefined, { shallow: true })
    }
  }

  const addTable = async () => {
    const tableID = await api.addTable(activeProject.id)
    refreshProject().then(() => selectTable(tableID))
  }

  return [addTable, selectTable] as const
}
