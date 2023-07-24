import {
  ActiveProject,
  ActivePrompt,
  Chain,
  ChainItem,
  CodeChainItem,
  CodeConfig,
  Prompt,
  PromptChainItem,
  RunConfig,
  Version,
} from '@/types'
import { useEffect, useState } from 'react'
import api from '@/src/client/api'
import { toActivePrompt } from '@/pages/[projectID]'
import ChainNodeEditor, { ChainNode, ExtractUnboundChainVariables, InputNode, OutputNode } from './chainNodeEditor'
import useSavePrompt from './useSavePrompt'

const IsChainItem = (item: ChainNode): item is ChainItem => item !== InputNode && item !== OutputNode
export const IsPromptChainItem = (item: ChainNode): item is PromptChainItem => IsChainItem(item) && 'promptID' in item
export const IsCodeChainItem = (item: ChainNode): item is CodeChainItem => IsChainItem(item) && 'code' in item
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
  promptItemForID: (promptID: number) => ChainItem
  refreshPrompt: (promptID: number) => Promise<ActivePrompt>
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
  const [activeNodeIndex, setActiveNodeIndex] = useState(1)
  const items = nodes.filter(IsChainItem)

  const [activePromptCache, setActivePromptCache] = useState<Record<number, ActivePrompt>>({})
  const promptCache: PromptCache = {
    promptForID: id => activePromptCache[id],
    promptForItem: item => activePromptCache[item.promptID],
    versionForItem: item => activePromptCache[item.promptID]?.versions.find(version => version.id === item.versionID),
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
    refreshPrompt: async (promptID: number) =>
      api.getPromptVersions(promptID).then(versions => {
        const prompt = toActivePrompt(promptID, versions, project)
        setActivePromptCache(cache => ({ ...cache, [promptID]: prompt }))
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
        return prompt
      }),
  }
  const chainIsLoaded = items.every(node => !IsPromptChainItem(node) || promptCache.promptForItem(node))

  useEffect(() => {
    const promptItems = items.filter(IsPromptChainItem)
    const unloadedItem = promptItems.find(item => !activePromptCache[item.promptID])
    if (unloadedItem) {
      promptCache.refreshPrompt(unloadedItem.promptID)
    }
  }, [project, items, nodes, setNodes, activePromptCache, promptCache])

  const activeNode = nodes[activeNodeIndex]
  const activePrompt = IsPromptChainItem(activeNode) ? promptCache.promptForItem(activeNode) : undefined
  const [activeVersion, setActiveVersion] = useState<Version>()
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activeVersion, setActiveVersion)

  const selectVersion = (version?: Version) => {
    savePrompt()
    setActiveVersion(version)
    if (version && IsPromptChainItem(activeNode)) {
      setNodes([
        ...nodes.slice(0, activeNodeIndex),
        { ...activeNode, versionID: version.id },
        ...nodes.slice(activeNodeIndex + 1),
      ])
    }
  }

  if (activeVersion?.promptID !== activePrompt?.id) {
    selectVersion(IsPromptChainItem(activeNode) ? promptCache.versionForItem(activeNode) : undefined)
  } else if (activeVersion && activePrompt && !activePrompt.versions.some(version => version.id === activeVersion.id)) {
    selectVersion(activePrompt.versions.slice(-1)[0])
  }

  const updateActiveNodeIndex = (index: number) => {
    if (activePrompt) {
      savePrompt().then(_ => promptCache.refreshPrompt(activePrompt.id))
    }
    setActiveNodeIndex(index)
  }

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
      <div className='flex flex-col items-center w-1/3 h-full p-8 pr-0 overflow-y-auto'>
        {nodes.map((node, index) => (
          <ChainNodeBox
            key={index}
            chainNode={node}
            isFirst={index === 0}
            isActive={index === activeNodeIndex}
            callback={() => updateActiveNodeIndex(index)}
            prompts={project.prompts}
          />
        ))}
      </div>
      <ChainNodeEditor
        items={items}
        setItems={items => setNodes([InputNode, ...items, OutputNode])}
        activeItemIndex={activeNodeIndex - 1}
        activeNode={activeNode}
        promptCache={promptCache}
        project={project}
        onRun={() => setActiveNodeIndex(nodes.indexOf(OutputNode))}
        savePrompt={() => savePrompt().then(versionID => versionID!)}
        selectVersion={selectVersion}
        setModifiedVersion={setModifiedVersion}
      />
    </div>
  )
}

function ChainNodeBox({
  chainNode,
  isFirst,
  isActive,
  callback,
  prompts,
}: {
  chainNode: ChainNode
  isFirst: boolean
  isActive: boolean
  callback: () => void
  prompts: Prompt[]
}) {
  const colorClass = isActive ? 'bg-blue-25 border-blue-50' : 'border-gray-300'
  return (
    <>
      {!isFirst && <div className='w-px h-4 border-l border-gray-300 min-h-[16px]' />}
      <div className={`text-center border px-4 py-2 rounded-lg cursor-pointer ${colorClass}`} onClick={callback}>
        {chainNode === InputNode && 'Input'}
        {chainNode === OutputNode && 'Output'}
        {IsPromptChainItem(chainNode) && prompts.find(prompt => prompt.id === chainNode.promptID)?.name}
        {IsCodeChainItem(chainNode) && 'Code block'}
      </div>
    </>
  )
}
