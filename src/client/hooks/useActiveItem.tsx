import api from '@/src/client/api'
import { ActiveChain, ActiveProject, ActivePrompt, IsPromptVersion } from '@/types'
import { ActiveItem, CompareItem, EndpointsItem } from '@/src/common/activeItem'
import useInitialState from './useInitialState'

const ActiveItemIsChain = (item: ActiveItem): item is ActiveChain =>
  item !== CompareItem && item !== EndpointsItem && 'referencedItemIDs' in item
const ActiveItemIsPrompt = (item: ActiveItem): item is ActivePrompt =>
  item !== CompareItem && item !== EndpointsItem && !ActiveItemIsChain(item)

const sameIDs = (a: { id: number } | undefined, b: { id: number } | undefined) => a?.id === b?.id
const sameParentIDs = (a: { parentID: number } | undefined, b: { parentID: number } | undefined) =>
  a?.parentID === b?.parentID
const sameItems = (a: ActiveItem | undefined, b: ActiveItem | undefined) =>
  (a === CompareItem && b === CompareItem) ||
  (a === EndpointsItem && b === EndpointsItem) ||
  (a !== CompareItem && a !== EndpointsItem && b !== CompareItem && b !== EndpointsItem && sameIDs(a, b))

export default function useActiveItem(initialActiveProject: ActiveProject, initialActiveItem: ActiveItem | null) {
  const [activeProject, setActiveProject] = useInitialState(initialActiveProject, sameIDs)
  const refreshProject = () => api.getProject(activeProject.id).then(setActiveProject)

  const [activeItem, setActiveItem] = useInitialState(initialActiveItem ?? undefined, sameItems)
  const activePrompt = activeItem && ActiveItemIsPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && ActiveItemIsChain(activeItem) ? activeItem : undefined

  return [activeProject, refreshProject, activeItem, setActiveItem, activePrompt, activeChain] as const
}

export function useActiveVersion(activeItem: ActiveItem | undefined) {
  const initialActiveVersion =
    activeItem === CompareItem || activeItem === EndpointsItem ? undefined : activeItem?.versions?.slice(-1)?.[0]
  const [activeVersion, setActiveVersion] = useInitialState(initialActiveVersion, sameParentIDs)
  const activePromptVersion = activeVersion && IsPromptVersion(activeVersion) ? activeVersion : undefined
  const activeChainVersion = activeVersion && !IsPromptVersion(activeVersion) ? activeVersion : undefined

  return [activeVersion, setActiveVersion, activePromptVersion, activeChainVersion] as const
}
