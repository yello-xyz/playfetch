import { Chain, IsProjectItem, ProjectItemIsChain, Prompt, Table } from '@/types'
import api from '@/src/client/api'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/projectContext'

export default function useProjectItemActions(onDelete?: () => void) {
  const refreshActiveItem = useRefreshActiveItem()
  const refreshProject = useRefreshProject()
  const refreshOnRename = (item: Prompt | Chain | Table) => {
    if (!IsProjectItem(item) || ProjectItemIsChain(item)) {
      refreshActiveItem()
    }
    return refreshProject()
  }

  const renameItem = (item: Prompt | Chain | Table, name: string) =>
    IsProjectItem(item)
      ? ProjectItemIsChain(item)
        ? api.renameChain(item.id, name)
        : api.renamePrompt(item.id, name)
      : api.renameTable(item.id, name)
  const renameAndRefresh = (item: Prompt | Chain | Table, name: string) =>
    name !== item.name ? renameItem(item, name).then(() => refreshOnRename(item)) : Promise.resolve()

  const deleteItem = (item: Prompt | Chain) =>
    ProjectItemIsChain(item) ? api.deleteChain(item.id) : api.deletePrompt(item.id)
  const deleteAndRefresh = (item: Prompt | Chain) => deleteItem(item).then(onDelete ?? refreshProject)

  const duplicateItem = (item: Prompt | Chain) =>
    ProjectItemIsChain(item) ? api.duplicateChain(item.id) : api.duplicatePrompt(item.id)
  const duplicateAndRefresh = (item: Prompt | Chain) => duplicateItem(item).then(refreshProject)

  return [renameAndRefresh, duplicateAndRefresh, deleteAndRefresh] as const
}