import { ActiveProject, ActivePrompt, ChainItem, PromptChainItem, PromptVersion } from '@/types'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { ChainNode, IsPromptChainItem } from '../../../components/chains/chainNode'
import useActiveItemCache from './useActiveItemCache'

export type ChainPromptCache = {
  promptForItem: (item: PromptChainItem) => ActivePrompt | undefined
  versionForItem: (item: PromptChainItem) => PromptVersion | undefined
  refreshPrompt: (promptID: number) => void
}

export default function useChainPromptCache(
  project: ActiveProject,
  nodes: ChainNode[],
  setNodes: Dispatch<SetStateAction<ChainNode[]>>
) {
  const onRefreshPrompt = useCallback(
    (activePrompt: ActivePrompt) =>
      setNodes(nodes =>
        nodes.map(node =>
          IsPromptChainItem(node) && node.promptID === activePrompt.id
            ? {
                ...node,
                activePrompt,
                version: activePrompt.versions.find(version => version.id === node.versionID),
              }
            : node
        )
      ),
    [setNodes]
  )

  const promptIDs = nodes.filter(IsPromptChainItem).map(item => item.promptID)

  const promptCache = useActiveItemCache(project, promptIDs, item => onRefreshPrompt(item as ActivePrompt))
  const promptForID = (id: number) => promptCache.itemForID(id) as ActivePrompt | undefined

  const chainPromptCache: ChainPromptCache = {
    refreshPrompt: promptCache.refreshItem,
    promptForItem: item => promptForID(item.promptID),
    versionForItem: item => promptForID(item.promptID)?.versions.find(version => version.id === item.versionID),
  }

  return chainPromptCache
}
