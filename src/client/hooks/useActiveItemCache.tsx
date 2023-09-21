import { ActiveChain, ActiveProject, ActivePrompt, ItemsInProject, ProjectItemIsChain } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import api from '@/src/client/api'

export type ActiveItemCache = {
  itemForID: (id: number) => ActivePrompt | ActiveChain | undefined
  refreshItem: (itemID: number) => void
}

export default function useActiveItemCache(
  project: ActiveProject,
  itemIDs: number[],
  onRefreshItem?: (item: ActivePrompt | ActiveChain) => void
) {
  const [activeItemCache, setActiveItemCache] = useState<Record<number, ActivePrompt | ActiveChain>>({})

  const refreshItem = useCallback(
    (itemID: number) => {
      const item = ItemsInProject(project).find(item => item.id === itemID)
      if (ProjectItemIsChain(item)) {
        api.getChain(itemID, project).then(activeChain => {
          setActiveItemCache(cache => ({ ...cache, [itemID]: activeChain }))
          onRefreshItem?.(activeChain)
        })
      } else {
        api.getPrompt(itemID, project).then(activePrompt => {
          setActiveItemCache(cache => ({ ...cache, [itemID]: activePrompt }))
          onRefreshItem?.(activePrompt)
        })
      }
    },
    [project, onRefreshItem]
  )

  useEffect(() => {
    const unloadedItemID = itemIDs.find(itemID => !activeItemCache[itemID])
    if (unloadedItemID) {
      refreshItem(unloadedItemID)
    }
  }, [project, itemIDs, activeItemCache, refreshItem])

  return { itemForID: id => activeItemCache[id], refreshItem } as ActiveItemCache
}
