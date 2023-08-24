import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  ChainItem,
  ChainItemWithInputs,
  PromptChainItem,
  PromptVersion,
} from '@/types'
import { useCallback, useEffect, useState } from 'react'
import api from '@/src/client/api'
import ChainNodeEditor, { ExtractChainItemVariables } from './chainNodeEditor'
import useSavePrompt from './useSavePrompt'
import ChainEditor from './chainEditor'
import { ChainNode, InputNode, IsChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import { Allotment } from 'allotment'
import useSaveChain from './useSaveChain'

export type PromptCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  promptForItem: (item: PromptChainItem) => ActivePrompt | undefined
  versionForItem: (item: PromptChainItem) => PromptVersion | undefined
  promptItemForID: (promptID: number) => ChainItem
  refreshPrompt: (promptID: number) => Promise<ActivePrompt>
}

export default function ChainView({
  chain,
  project,
  onRefresh,
}: {
  chain: ActiveChain
  project: ActiveProject
  onRefresh: () => void
}) {
  // TODO add version UI so we can view or edit earlier versions as well.
  const [chainVersion, setChainVersion] = useState(chain.versions.slice(-1)[0])
  const saveChain = useSaveChain(chain, chainVersion, setChainVersion)
  // TODO update when active chain version changes
  const [nodes, setNodes] = useState([InputNode, ...chainVersion.items, OutputNode] as ChainNode[])
  const [activeNodeIndex, setActiveNodeIndex] = useState(1)
  const items = nodes.filter(IsChainItem)

  const [activePromptCache, setActivePromptCache] = useState<Record<number, ActivePrompt>>({})

  const refreshPrompt = useCallback(
    async (promptID: number) =>
      api.getPrompt(promptID, project).then(activePrompt => {
        setActivePromptCache(cache => ({ ...cache, [promptID]: activePrompt }))
        setNodes(
          nodes.map(node =>
            IsPromptChainItem(node) && node.promptID === promptID
              ? {
                  ...node,
                  activePrompt,
                  version: activePrompt.versions.find(version => version.id === node.versionID),
                }
              : node
          )
        )
        return activePrompt
      }),
    [nodes, project]
  )

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
    refreshPrompt,
  }

  useEffect(() => {
    const promptItems = items.filter(IsPromptChainItem)
    const unloadedItem = promptItems.find(item => !activePromptCache[item.promptID])
    if (unloadedItem) {
      refreshPrompt(unloadedItem.promptID)
    }
  }, [project, items, nodes, setNodes, activePromptCache, refreshPrompt])

  const activeNode = nodes[activeNodeIndex]
  const activePrompt = IsPromptChainItem(activeNode) ? promptCache.promptForItem(activeNode) : undefined
  const [activeVersion, setActiveVersion] = useState<PromptVersion>()
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activeVersion, setActiveVersion)

  const selectVersion = (version?: PromptVersion) => {
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

  if (activeVersion?.parentID !== activePrompt?.id) {
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

  const updateItems = (items: ChainItem[]) => {
    setNodes([InputNode, ...items, OutputNode])
    const itemsWithInputs: ChainItemWithInputs[] = items.map(item => ({
      ...item,
      activePrompt: undefined,
      version: undefined,
      inputs: ExtractChainItemVariables(item, promptCache),
    }))
    return saveChain(itemsWithInputs, onRefresh)
  }

  const minWidth = 320
  return (
    <Allotment>
      <Allotment.Pane minSize={minWidth} preferredSize='50%'>
        <ChainEditor
          nodes={nodes}
          setNodes={setNodes}
          activeIndex={activeNodeIndex}
          setActiveIndex={updateActiveNodeIndex}
          prompts={project.prompts}
        />
      </Allotment.Pane>
      <Allotment.Pane minSize={minWidth}>
        <ChainNodeEditor
          chain={chain}
          items={items}
          setItems={updateItems}
          activeItemIndex={activeNodeIndex - 1}
          activeNode={activeNode}
          promptCache={promptCache}
          onRun={() => setActiveNodeIndex(nodes.indexOf(OutputNode))}
          savePrompt={() => savePrompt().then(versionID => versionID!)}
          selectVersion={selectVersion}
          setModifiedVersion={setModifiedVersion}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
