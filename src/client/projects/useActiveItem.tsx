import api from '@/src/client/api'
import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  ActiveTable,
  IsPromptVersion,
  ProjectItemIsChain,
  ProjectItemIsPrompt,
  ProjectItemIsTable,
} from '@/types'
import {
  ActiveItem,
  BuildActiveChain,
  BuildActivePrompt,
  CompareItem,
  EndpointsItem,
  SettingsItem,
} from '@/src/common/activeItem'
import useInitialState from '../components/useInitialState'
import { useState } from 'react'

type ProjectItem = ActivePrompt | ActiveChain | ActiveTable
const ActiveItemHasID = (item: ActiveItem | undefined): item is ProjectItem | undefined =>
  item !== CompareItem && item !== EndpointsItem && item !== SettingsItem
const ActiveItemIsChain = (item: ActiveItem): item is ActiveChain => ActiveItemHasID(item) && ProjectItemIsChain(item)
const ActiveItemIsPrompt = (item: ActiveItem): item is ActivePrompt =>
  ActiveItemHasID(item) && ProjectItemIsPrompt(item)
const ActiveItemIsTable = (item: ActiveItem): item is ActiveTable => ActiveItemHasID(item) && ProjectItemIsTable(item)

const sameIDs = (a: { id: number } | undefined, b: { id: number } | undefined) => a?.id === b?.id
const sameItems = (a: ActiveItem | undefined, b: ActiveItem | undefined) =>
  (a === CompareItem && b === CompareItem) ||
  (a === EndpointsItem && b === EndpointsItem) ||
  (a === SettingsItem && b === SettingsItem) ||
  (ActiveItemHasID(a) && ActiveItemHasID(b) && sameIDs(a, b))

export default function useActiveItem(initialActiveProject: ActiveProject, initialActiveItem: ActiveItem | null) {
  const [activeProject, setActiveProject] = useInitialState(initialActiveProject, sameIDs)

  const refreshProject = () =>
    api.getProject(activeProject.id).then(project => {
      setActiveProject(project)
      setActiveItem(activeItem => {
        if (activeItem && ActiveItemIsPrompt(activeItem)) {
          const updatedPrompt = BuildActivePrompt(project)({
            prompt: activeItem,
            versions: activeItem.versions,
            inputValues: activeItem.inputValues,
            canSuggestImprovements: activeItem.canSuggestImprovements,
          })
          setActiveVersion(version => updatedPrompt.versions.find(v => v.id === version?.id) ?? version)
          return updatedPrompt
        } else if (activeItem && ActiveItemIsChain(activeItem)) {
          const updatedChain = BuildActiveChain(project)({
            chain: activeItem,
            versions: activeItem.versions,
            inputValues: activeItem.inputValues,
          })
          setActiveVersion(version => updatedChain.versions.find(v => v.id === version?.id) ?? version)
          return updatedChain
        } else {
          return activeItem
        }
      })
    })

  const [activeItem, setActiveItem] = useInitialState(initialActiveItem ?? undefined, sameItems)
  const activePrompt = activeItem && ActiveItemIsPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && ActiveItemIsChain(activeItem) ? activeItem : undefined
  const activeTable = activeItem && ActiveItemIsTable(activeItem) ? activeItem : undefined

  const defaultVersionForItem = (item: ActiveItem | undefined) =>
    item && ActiveItemHasID(item) && 'versions' in item ? item.versions.slice(-1)[0] : undefined

  const [activeVersion, setActiveVersion] = useState(defaultVersionForItem(activeItem))
  const activePromptVersion = activeVersion && IsPromptVersion(activeVersion) ? activeVersion : undefined
  const activeChainVersion = activeVersion && !IsPromptVersion(activeVersion) ? activeVersion : undefined

  const updateActiveItem = (item: ActiveItem | undefined) => {
    setActiveItem(item)
    if (!sameItems(item, activeItem)) {
      setActiveVersion(defaultVersionForItem(item))
    }
  }

  return [
    activeProject,
    refreshProject,
    activeItem,
    updateActiveItem,
    activePrompt,
    activeChain,
    activeTable,
    activeVersion,
    setActiveVersion,
    activePromptVersion,
    activeChainVersion,
  ] as const
}
