import { ActiveProject, ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { ChainNode, IsPromptChainItem } from '../../../components/chains/chainNode'
import useActiveItemCache, { ActiveItemCache } from './useActiveItemCache'

export type ChainPromptCache = ActiveItemCache & {
  promptForItem: (item: Omit<PromptChainItem, 'branch'>) => ActivePrompt | undefined
  versionForItem: (item: Omit<PromptChainItem, 'branch'>) => PromptVersion | undefined
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
  const promptForItem = (item: Omit<PromptChainItem, 'branch'>) =>
    promptCache.itemForID(item.promptID) as ActivePrompt | undefined

  const chainPromptCache: ChainPromptCache = {
    ...promptCache,
    promptForItem,
    versionForItem: item => selectVersion(promptForItem(item), item.versionID),
  }

  return chainPromptCache
}
