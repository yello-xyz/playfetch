import { ActiveProject, ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { ChainNode, IsPromptChainItem } from './chainNode'
import useActiveItemCache, { ActiveItemCache } from '@/src/client/projects/useActiveItemCache'

export type ChainItemCache = ActiveItemCache<ActivePrompt> & {
  promptForItem: (item: Omit<PromptChainItem, 'branch'>) => ActivePrompt | undefined
  versionForItem: (item: Omit<PromptChainItem, 'branch'>) => PromptVersion | undefined
}

const specifiedOrLastVersion = (versions: PromptVersion[], versionID?: number) =>
  versionID ? versions.find(version => version.id === versionID) : versions.slice(-1)[0]
const selectVersion = (prompt?: ActivePrompt, versionID?: number) =>
  specifiedOrLastVersion(prompt?.versions ?? [], versionID)

export default function useChainItemCache(
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
                versionID: node.versionID ?? selectVersion(activePrompt, node.versionID)?.id,
                version: selectVersion(activePrompt, node.versionID),
              }
            : node
        )
      ),
    [setNodes]
  )

  const promptIDs = nodes.filter(IsPromptChainItem).map(item => item.promptID)

  const activeItemCache = useActiveItemCache<ActivePrompt>(project, promptIDs, item => onRefreshPrompt(item))
  const promptForItem = (item: Omit<PromptChainItem, 'branch'>) => activeItemCache.itemForID(item.promptID)

  const chainItemCache: ChainItemCache = {
    ...activeItemCache,
    promptForItem,
    versionForItem: item => selectVersion(promptForItem(item), item.versionID),
  }

  return chainItemCache
}
