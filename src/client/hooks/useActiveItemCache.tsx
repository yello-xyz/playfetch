import { ActiveChain, ActiveProject, ActivePrompt, ProjectItemIsChain } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import api from '@/src/client/api'

export type ActiveItemCache<ActiveItem extends ActivePrompt | ActiveChain> = {
  nameForID: (id: number) => string
  itemForID: (id: number) => ActiveItem | undefined
  refreshItem: (itemID: number) => void
}

export default function useActiveItemCache<ActiveItem extends ActivePrompt | ActiveChain>(
  project: ActiveProject,
  itemIDs: number[],
  onRefreshItem?: (item: ActiveItem) => void
): ActiveItemCache<ActiveItem> {
  const [activeItemCache, setActiveItemCache] = useState<Record<number, ActiveItem>>({})

  const findItemForID = useCallback(
    (itemID: number) => [...project.prompts, ...project.chains].find(item => item.id === itemID),
    [project]
  )

  const refreshItem = useCallback(
    (itemID: number) => {
      const item = findItemForID(itemID)
      if (ProjectItemIsChain(item)) {
        api.getChain(itemID, project).then(activeChain => {
          setActiveItemCache(cache => ({ ...cache, [itemID]: activeChain as ActiveItem }))
          onRefreshItem?.(activeChain as ActiveItem)
        })
      } else {
        api.getPrompt(itemID, project).then(activePrompt => {
          setActiveItemCache(cache => ({ ...cache, [itemID]: activePrompt as ActiveItem }))
          onRefreshItem?.(activePrompt as ActiveItem)
        })
      }
    },
    [project, findItemForID, onRefreshItem]
  )

  const [itemIDsToReload, setItemIDsToReload] = useState<Set<number>>(new Set())
  const reloadItem = (itemID: number) => {
    setItemIDsToReload(itemIDsToReload.add(itemID))
    setLoadingItemIDs(new Set([...loadingItemIDs].filter(id => id !== itemID)))
  }

  const [loadingItemIDs, setLoadingItemIDs] = useState<Set<number>>(new Set())
  useEffect(() => {
    const unloadedItemID = itemIDs.find(
      itemID => (!activeItemCache[itemID] || itemIDsToReload.has(itemID)) && !loadingItemIDs.has(itemID)
    )
    if (unloadedItemID) {
      setLoadingItemIDs(loadingItemIDs => loadingItemIDs.add(unloadedItemID))
      setItemIDsToReload(new Set([...itemIDsToReload].filter(id => id !== unloadedItemID)))
      refreshItem(unloadedItemID)
    }
  }, [project, itemIDs, activeItemCache, refreshItem, loadingItemIDs, itemIDsToReload])

  const nameForID = (itemID: number) => findItemForID(itemID)!.name

  return { nameForID, itemForID: id => activeItemCache[id], refreshItem: reloadItem }
}
