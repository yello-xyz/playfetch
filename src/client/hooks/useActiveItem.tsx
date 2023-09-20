import api from '@/src/client/api'
import { ActiveChain, ActiveProject, ActivePrompt, ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import { useState } from 'react'
import { ActiveItem, CompareItem, EndpointsItem } from '@/src/common/activeItem'

const ActiveItemIsChain = (item: ActiveItem): item is ActiveChain =>
  item !== CompareItem && item !== EndpointsItem && 'referencedItemIDs' in item
const ActiveItemIsPrompt = (item: ActiveItem): item is ActivePrompt =>
  item !== CompareItem && item !== EndpointsItem && !ActiveItemIsChain(item)

export default function useActiveItem(initialActiveProject: ActiveProject, initialActiveItem: ActiveItem | null) {
  const [activeProject, setActiveProject] = useState(initialActiveProject)
  const refreshProject = () => api.getProject(activeProject.id).then(setActiveProject)

  const [activeItem, setActiveItem] = useState(initialActiveItem ?? undefined)
  const activePrompt = activeItem && ActiveItemIsPrompt(activeItem) ? activeItem : undefined
  const activeChain = activeItem && ActiveItemIsChain(activeItem) ? activeItem : undefined

  return [activeProject, refreshProject, activeItem, setActiveItem, activePrompt, activeChain] as const
}

export function useActiveVersion(activeItem: ActiveItem | undefined) {
  const [activeVersion, setActiveVersion] = useState<PromptVersion | ChainVersion | undefined>(
    activeItem === CompareItem || activeItem === EndpointsItem ? undefined : activeItem?.versions?.slice(-1)?.[0]
  )
  const activePromptVersion = activeVersion && IsPromptVersion(activeVersion) ? activeVersion : undefined
  const activeChainVersion = activeVersion && !IsPromptVersion(activeVersion) ? activeVersion : undefined

  return [activeVersion, setActiveVersion, activePromptVersion, activeChainVersion] as const
}
