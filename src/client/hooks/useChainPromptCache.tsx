import { ActiveProject, ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { ChainNode, IsPromptChainItem } from '../../../components/chains/chainNode'
import useActiveItemCache from './useActiveItemCache'

export type ChainPromptCache = {
  promptForItem: (item: PromptChainItem) => ActivePrompt | undefined
  versionForItem: (item: PromptChainItem) => PromptVersion | undefined
  refreshPrompt: (promptID: number) => void
}

const specifiedOrLastVersion = (versions: PromptVersion[], versionID?: number) =>
  versionID ? versions.find(version => version.id === versionID) : versions.slice(-1)[0]
const selectVersion = (prompt?: ActivePrompt, versionID?: number) =>
  specifiedOrLastVersion(prompt?.versions ?? [], versionID)

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
                versionID: node.versionID ?? selectVersion(activePrompt, node.versionID)?.id,
                version: selectVersion(activePrompt, node.versionID),
              }
            : node
        )
      ),
    [setNodes]
  )

  const promptIDs = nodes.filter(IsPromptChainItem).map(item => item.promptID)

  const promptCache = useActiveItemCache(project, promptIDs, item => onRefreshPrompt(item as ActivePrompt))
  const promptForItem = (item: PromptChainItem) => promptCache.itemForID(item.promptID) as ActivePrompt | undefined

  const chainPromptCache: ChainPromptCache = {
    refreshPrompt: promptCache.refreshItem,
    promptForItem,
    versionForItem: item => selectVersion(promptForItem(item), item.versionID),
  }

  return chainPromptCache
}
