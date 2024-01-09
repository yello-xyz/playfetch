import { ActiveChain, ActiveProject, ActivePrompt, ItemsInProject, ProjectItemIsChain } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import api from '@/src/client/api'

export type ActiveItemCache = {
  nameForID: (id: number) => string
  itemForID: (id: number) => ActivePrompt | ActiveChain | undefined
  refreshItem: (itemID: number) => void
  clearItem: (itemID: number) => void
}

export default function useActiveItemCache(
  project: ActiveProject,
  itemIDs: number[],
  onRefreshItem?: (item: ActivePrompt | ActiveChain) => void
): ActiveItemCache {
  const [activeItemCache, setActiveItemCache] = useState<Record<number, ActivePrompt | ActiveChain>>({})

  const findItemForID = useCallback(
    (itemID: number) => ItemsInProject(project).find(item => item.id === itemID),
    [project]
  )

  const refreshItem = useCallback(
    (itemID: number) => {
      const item = findItemForID(itemID)
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
    [project, findItemForID, onRefreshItem]
  )

  const clearItem = (itemID: number) => {
    setLoadingItemIDs(new Set([...loadingItemIDs].filter(id => id !== itemID)))
    setActiveItemCache(cache => Object.fromEntries(Object.entries(cache).filter(([id]) => Number(id) !== itemID)))
  }

  const [loadingItemIDs, setLoadingItemIDs] = useState<Set<number>>(new Set())
  useEffect(() => {
    const unloadedItemID = itemIDs.find(itemID => !activeItemCache[itemID] && !loadingItemIDs.has(itemID))
    if (unloadedItemID) {
      setLoadingItemIDs(loadingItemIDs => loadingItemIDs.add(unloadedItemID))
      refreshItem(unloadedItemID)
    }
  }, [project, itemIDs, activeItemCache, refreshItem, loadingItemIDs])

  const nameForID = (itemID: number) => findItemForID(itemID)!.name

  return { nameForID, itemForID: id => activeItemCache[id], refreshItem, clearItem }
}
