import { ActiveProject, ActivePrompt, ChainItem, PromptChainItem, PromptVersion } from '@/types'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { ChainNode, IsPromptChainItem } from '../../../components/chains/chainNode'
import useActiveItemCache from './useActiveItemCache'

export type ChainPromptCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  promptForItem: (item: PromptChainItem) => ActivePrompt | undefined
  versionForItem: (item: PromptChainItem) => PromptVersion | undefined
  promptItemForID: (promptID: number) => ChainItem
  refreshPrompt: (promptID: number) => void
}

export default function useChainPromptCache(
  project: ActiveProject,
  nodes: ChainNode[],
  setNodes: Dispatch<SetStateAction<ChainNode[]>>
) {
  const onRefreshPrompt = useCallback(
    (promptID: number, activePrompt: ActivePrompt) =>
      setNodes(nodes =>
        nodes.map(node =>
          IsPromptChainItem(node) && node.promptID === promptID
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

  const promptCache = useActiveItemCache(project, promptIDs, onRefreshPrompt)

  const chainPromptCache: ChainPromptCache = {
    promptForID: id => promptCache.promptForID(id),
    refreshPrompt: promptCache.refreshPrompt,
    promptForItem: item => promptCache.promptForID(item.promptID),
    versionForItem: item =>
      promptCache.promptForID(item.promptID)?.versions.find(version => version.id === item.versionID),
    promptItemForID: (promptID: number) => {
      const prompt = project.prompts.find(prompt => prompt.id === promptID)!
      const versionID = prompt.lastVersionID
      const cachedPrompt = promptCache.promptForID(promptID)
      return {
        promptID,
        versionID,
        ...(cachedPrompt ? { prompt: cachedPrompt, version: cachedPrompt.versions.slice(-1)[0] } : {}),
      }
    },
  }

  return chainPromptCache
}
