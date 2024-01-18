import api from '@/src/client/api'
import { ActiveProject } from '@/types'

export default function useTable(activeProject: ActiveProject, refreshProject: () => Promise<void>) {
  const addTable = async () => {
    const tableID = await api.addTable(activeProject.id)
    refreshProject() //.then(() => selectChain(chainID))
  }

  return [addTable] as const
}
