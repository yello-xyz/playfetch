import { ActiveWorkspace } from '@/types'
import api from '@/src/client/api'

export default function useWorkspaceActions(onRenamed: () => void, onDeleted: () => void) {
  const renameWorkspace = (workspace: ActiveWorkspace, name: string) =>
    api.renameWorkspace(workspace.id, name).then(onRenamed)

  const deleteWorkspace = (workspace: ActiveWorkspace) => api.deleteWorkspace(workspace.id).then(onDeleted)

  const leaveWorkspace = (workspace: ActiveWorkspace) => api.leaveWorkspace(workspace.id).then(onDeleted)

  return [renameWorkspace, deleteWorkspace, leaveWorkspace] as const
}
