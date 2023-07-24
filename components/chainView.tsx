import {
  ActiveProject,
  ActivePrompt,
  Chain,
  ChainItem,
  CodeConfig,
  PromptChainItem,
  RunConfig,
  Version,
} from '@/types'
import { useEffect, useState } from 'react'
import api from '@/src/client/api'
import { toActivePrompt } from '@/pages/[projectID]'
import ChainNodeEditor, { ChainNode, ExtractUnboundChainVariables, InputNode, OutputNode } from './chainNodeEditor'

const IsChainItem = (item: ChainNode): item is ChainItem => item !== InputNode && item !== OutputNode
export const IsPromptChainItem = (item: ChainNode): item is PromptChainItem => IsChainItem(item) && 'promptID' in item
export const ChainItemToConfig = (item: ChainItem): RunConfig | CodeConfig =>
  IsPromptChainItem(item)
    ? {
        versionID: item.versionID,
        output: item.output,
        includeContext: item.includeContext,
      }
    : item

export type PromptCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  promptForItem: (item: PromptChainItem) => ActivePrompt | undefined
  versionForItem: (item: PromptChainItem) => Version | undefined
}

export default function ChainView({
  chain,
  project,
  onRefresh,
}: {
  chain: Chain
  project: ActiveProject
  onRefresh: () => void
}) {
  const [nodes, setNodes] = useState([InputNode, ...chain.items, OutputNode] as ChainNode[])
  const [activeNode, setActiveNode] = useState(nodes.slice(1)[0])
  const items = nodes.filter(IsChainItem)

  const [activePromptCache, setActivePromptCache] = useState<Record<number, ActivePrompt>>({})
  const promptCache: PromptCache = {
    promptForID: id => activePromptCache[id],
    promptForItem: item => activePromptCache[item.promptID],
    versionForItem: item => activePromptCache[item.promptID]?.versions.find(version => version.id === item.versionID),
  }
  const chainIsLoaded = items.every(node => !IsPromptChainItem(node) || promptCache.promptForItem(node))

  useEffect(() => {
    const promptItems = items.filter(IsPromptChainItem)
    const unloadedItem = promptItems.find(item => !activePromptCache[item.promptID])
    if (unloadedItem) {
      api.getPromptVersions(unloadedItem.promptID).then(versions => {
        const prompt = toActivePrompt(unloadedItem.promptID, versions, project)
        setActivePromptCache(cache => ({ ...cache, [prompt.id]: prompt }))
        setNodes(
          nodes.map(node =>
            IsPromptChainItem(node) && node.promptID === prompt.id
              ? {
                  ...node,
                  prompt,
                  version: prompt.versions.find(version => version.id === node.versionID),
                }
              : node
          )
        )
      })
    }
  }, [project, items, nodes, setNodes, activePromptCache])

  const inputs = ExtractUnboundChainVariables(items, promptCache)
  const strippedItems = items.map(item =>
    IsPromptChainItem(item) ? { promptID: item.promptID, ...ChainItemToConfig(item) } : item
  )
  const itemsKey = JSON.stringify(strippedItems)
  const [savedItemsKey, setSavedItemsKey] = useState(itemsKey)
  if (chainIsLoaded && itemsKey !== savedItemsKey) {
    setSavedItemsKey(itemsKey)
    api.updateChain(chain.id, strippedItems, inputs).then(onRefresh)
  }

  return (
    <div className='flex items-stretch h-full'>
      <ChainNodeEditor
        items={items}
        setItems={items => setNodes([InputNode, ...items, OutputNode])}
        activeNode={activeNode}
        promptCache={promptCache}
        project={project}
      />
    </div>
  )
}
