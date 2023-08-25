import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  ChainItem,
  ChainItemWithInputs,
  ChainVersion,
  PromptChainItem,
  PromptVersion,
} from '@/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/src/client/api'
import ChainNodeEditor, { ExtractChainItemVariables } from './chainNodeEditor'
import useSavePrompt from './useSavePrompt'
import ChainEditor from './chainEditor'
import { ChainNode, InputNode, IsChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import { Allotment } from 'allotment'
import { useRefreshActiveItem } from './refreshContext'

export type PromptCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  promptForItem: (item: PromptChainItem) => ActivePrompt | undefined
  versionForItem: (item: PromptChainItem) => PromptVersion | undefined
  promptItemForID: (promptID: number) => ChainItem
  refreshPrompt: (promptID: number) => Promise<ActivePrompt>
}

export default function ChainView({
  chain,
  activeVersion,
  project,
  saveChain,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  project: ActiveProject
  saveChain: (
    items: ChainItemWithInputs[],
    onSaved?: ((versionID: number) => Promise<void>) | (() => void)
  ) => Promise<number | undefined>
}) {
  const [nodes, setNodes] = useState([InputNode, ...activeVersion.items, OutputNode] as ChainNode[])
  const [activeNodeIndex, setActiveNodeIndex] = useState(1)
  const [syncedVersionID, setSyncedVersionID] = useState(activeVersion.id)
  if (syncedVersionID !== activeVersion.id) {
    setSyncedVersionID(activeVersion.id)
    const newNodes = [InputNode, ...activeVersion.items, OutputNode] as ChainNode[]
    setNodes(newNodes)
    if (activeNodeIndex >= newNodes.length) {
      setActiveNodeIndex(1)
    }
  }
  const items = nodes.filter(IsChainItem)

  const refreshActiveItem = useRefreshActiveItem()

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
  }, [project, items, activePromptCache, refreshPrompt])

  const activeNode = nodes[activeNodeIndex]
  const activePrompt = IsPromptChainItem(activeNode) ? promptCache.promptForItem(activeNode) : undefined
  const [activePromptVersion, setActivePromptVersion] = useState<PromptVersion>()
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activePromptVersion, setActivePromptVersion)

  const selectVersion = (version?: PromptVersion) => {
    savePrompt()
    setActivePromptVersion(version)
    if (version && IsPromptChainItem(activeNode)) {
      setNodes([
        ...nodes.slice(0, activeNodeIndex),
        { ...activeNode, versionID: version.id },
        ...nodes.slice(activeNodeIndex + 1),
      ])
    }
  }

  if (activePromptVersion?.parentID !== activePrompt?.id) {
    selectVersion(IsPromptChainItem(activeNode) ? promptCache.versionForItem(activeNode) : undefined)
  } else if (
    activePromptVersion &&
    activePrompt &&
    !activePrompt.versions.some(version => version.id === activePromptVersion.id)
  ) {
    selectVersion(activePrompt.versions.slice(-1)[0])
  }

  const updateActiveNodeIndex = (index: number) => {
    if (activePrompt) {
      savePrompt().then(_ => promptCache.refreshPrompt(activePrompt.id))
    }
    setActiveNodeIndex(index)
  }

  const savedItemsKey = useRef<string>()
  const saveItems = (items: ChainItem[], force = false): Promise<number | undefined> => {
    const itemsToSave = items.map(item => ({
      ...item,
      activePrompt: undefined,
      version: undefined,
      inputs: ExtractChainItemVariables(item, promptCache),
    }))
    const itemsKey = JSON.stringify(itemsToSave)
    if (force || itemsKey !== savedItemsKey.current) {
      // TODO deal with race condition when force saving while already saving a change.
      savedItemsKey.current = itemsKey
      return saveChain(itemsToSave, refreshActiveItem)
    }
    return Promise.resolve(undefined)
  }

  const updateItems = (items: ChainItem[]) => {
    setNodes([InputNode, ...items, OutputNode])
    saveItems(items)
  }

  const prepareForRunning = async (items: ChainItem[]): Promise<number> => {
    setActiveNodeIndex(nodes.indexOf(OutputNode))
    const versionID = await saveItems(items, true)
    return versionID!
  }

  const minWidth = 320
  return (
    <Allotment>
      <Allotment.Pane minSize={minWidth} preferredSize='50%'>
        <ChainEditor
          chain={chain}
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
          activeVersion={activeVersion}
          items={items}
          setItems={updateItems}
          activeItemIndex={activeNodeIndex - 1}
          activeNode={activeNode}
          promptCache={promptCache}
          prepareForRunning={prepareForRunning}
          savePrompt={() => savePrompt().then(versionID => versionID!)}
          selectVersion={selectVersion}
          setModifiedVersion={setModifiedVersion}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
