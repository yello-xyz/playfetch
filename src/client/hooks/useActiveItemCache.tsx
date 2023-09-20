import { ActiveChain, ActiveProject, ActivePrompt } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import api from '@/src/client/api'

export type ActiveItemCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  chainForID: (id: number) => ActiveChain | undefined
  refreshPrompt: (promptID: number) => void
  refreshChain: (promptID: number) => void
}

export default function useActiveItemCache(
  project: ActiveProject,
  promptIDs: number[],
  onRefreshPrompt?: (promptID: number, prompt: ActivePrompt) => void,
  chainIDs: number[] = [],
  onRefreshChain?: (chainID: number, item: ActiveChain) => void
) {
  const [activePromptCache, setActivePromptCache] = useState<Record<number, ActivePrompt>>({})
  const [activeChainCache, setActiveChainCache] = useState<Record<number, ActiveChain>>({})

  const refreshPrompt = useCallback(
    (promptID: number) =>
      api.getPrompt(promptID, project).then(activePrompt => {
        setActivePromptCache(cache => ({ ...cache, [promptID]: activePrompt }))
        onRefreshPrompt?.(promptID, activePrompt)
      }),
    [project, onRefreshPrompt]
  )

  const refreshChain = useCallback(
    (chainID: number) =>
      api.getChain(chainID, project).then(activeChain => {
        setActiveChainCache(cache => ({ ...cache, [chainID]: activeChain }))
        onRefreshChain?.(chainID, activeChain)
      }),
    [project, onRefreshChain]
  )

  const activeItemCache: ActiveItemCache = {
    promptForID: id => activePromptCache[id],
    chainForID: id => activeChainCache[id],
    refreshPrompt,
    refreshChain,
  }

  useEffect(() => {
    const unloadedPromptID = promptIDs.find(promptID => !activePromptCache[promptID])
    if (unloadedPromptID) {
      refreshPrompt(unloadedPromptID)
    }
  }, [project, promptIDs, activePromptCache, refreshPrompt])

  useEffect(() => {
    const unloadedChainID = chainIDs.find(chainID => !activeChainCache[chainID])
    if (unloadedChainID) {
      refreshChain(unloadedChainID)
    }
  }, [project, chainIDs, activeChainCache, refreshChain])

  return activeItemCache
}
