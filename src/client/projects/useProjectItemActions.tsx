import { Chain, ProjectItemIsChain, ProjectItemIsPrompt, ProjectItemIsTable, Prompt, Table } from '@/types'
import api from '@/src/client/api'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/projects/projectContext'

export default function useProjectItemActions(onDelete?: () => void) {
  const refreshActiveItem = useRefreshActiveItem()
  const refreshProject = useRefreshProject()
  const refreshOnRename = async (item: Prompt | Chain | Table) =>
    ProjectItemIsTable(item) || ProjectItemIsChain(item)
      ? Promise.all([refreshActiveItem(), refreshProject()]).then(() => {})
      : refreshProject()

  const renameItem = (item: Prompt | Chain | Table, name: string) =>
    ProjectItemIsPrompt(item)
      ? api.renamePrompt(item.id, name)
      : ProjectItemIsChain(item)
        ? api.renameChain(item.id, name)
        : api.renameTable(item.id, name)
  const renameAndRefresh = (item: Prompt | Chain | Table, name: string) =>
    name !== item.name ? renameItem(item, name).then(() => refreshOnRename(item)) : Promise.resolve()

  const deleteItem = (item: Prompt | Chain | Table) =>
    ProjectItemIsPrompt(item)
      ? api.deletePrompt(item.id)
      : ProjectItemIsChain(item)
        ? api.deleteChain(item.id)
        : api.deleteTable(item.id)
  const deleteAndRefresh = (item: Prompt | Chain | Table) => deleteItem(item).then(onDelete ?? refreshProject)

  const duplicateItem = (item: Prompt | Chain) =>
    ProjectItemIsChain(item) ? api.duplicateChain(item.id) : api.duplicatePrompt(item.id)
  const duplicateAndRefresh = (item: Prompt | Chain) => duplicateItem(item).then(refreshProject)

  const copyToProject = (item: Prompt, projectID: number) => api.duplicatePrompt(item.id, projectID)
  const copyToProjectAndRefresh = (item: Prompt, projectID: number) =>
    copyToProject(item, projectID).then(refreshProject)

  return [renameAndRefresh, duplicateAndRefresh, deleteAndRefresh, copyToProjectAndRefresh] as const
}
