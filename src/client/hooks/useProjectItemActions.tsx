import { Chain, ProjectItemIsChain, Prompt } from '@/types'
import api from '@/src/client/api'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/projectContext'

export default function useProjectItemActions() {
  const refreshActiveItem = useRefreshActiveItem()
  const refreshProject = useRefreshProject()
  const refreshOnRename = (item: Prompt | Chain) => {
    if (ProjectItemIsChain(item)) {
      refreshActiveItem()
    }
    refreshProject()
  }

  const deleteItem = (item: Prompt | Chain) =>
    ProjectItemIsChain(item) ? api.deleteChain(item.id) : api.deletePrompt(item.id)
  const duplicateItem = (item: Prompt | Chain) =>
    ProjectItemIsChain(item) ? api.duplicateChain(item.id) : api.duplicatePrompt(item.id)
  const renameItem = (item: Prompt | Chain, name: string) =>
    (ProjectItemIsChain(item) ? api.renameChain(item.id, name) : api.renamePrompt(item.id, name)).then(() =>
      refreshOnRename(item)
    )

  return [renameItem, duplicateItem, deleteItem] as const
}
