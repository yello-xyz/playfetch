import { Workspace } from '@/types'
import api from '@/src/client/api'

export default function useWorkspaceActions(onRenamed: () => void | Promise<void>, onDeleted = onRenamed) {
  const renameWorkspace = (workspace: Workspace, name: string) =>
    api.renameWorkspace(workspace.id, name).then(onRenamed)

  const deleteWorkspace = (workspace: Workspace) => api.deleteWorkspace(workspace.id).then(onDeleted)

  const leaveWorkspace = (workspace: Workspace) => api.leaveWorkspace(workspace.id).then(onDeleted)

  return [renameWorkspace, deleteWorkspace, leaveWorkspace] as const
}
