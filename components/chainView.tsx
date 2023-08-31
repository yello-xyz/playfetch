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
import useSavePrompt from '@/src/client/hooks/useSavePrompt'
import ChainEditor from './chainEditor'
import { ChainNode, InputNode, IsChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import { Allotment } from 'allotment'
import { useRefreshActiveItem } from '@/src/client/context/refreshContext'
import CommentsPane from './commentsPane'
import useCommentSelection from '@/src/client/hooks/useCommentSelection'
import VersionTimeline from './versionTimeline'
import { SingleTabHeader } from './tabSelector'
import IconButton from './iconButton'
import closeIcon from '@/public/close.svg'

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
  setActiveVersion,
  project,
  showComments,
  setShowComments,
  saveChain,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  setActiveVersion: (version: ChainVersion) => void
  project: ActiveProject
  showComments: boolean
  setShowComments: (show: boolean) => void
  saveChain: (
    items: ChainItemWithInputs[],
    onSaved?: ((versionID: number) => Promise<void>) | (() => void)
  ) => Promise<number | undefined>
}) {
  const [nodes, setNodes] = useState([InputNode, ...activeVersion.items, OutputNode] as ChainNode[])

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
    refreshPrompt,
  }

  const [activeNodeIndex, setActiveNodeIndex] = useState(1)

  const items = nodes.filter(IsChainItem)
  const getItemsToSave = (items: ChainItem[]) =>
    items.map(item => ({
      ...item,
      activePrompt: undefined,
      version: undefined,
      inputs: ExtractChainItemVariables(item, promptCache),
    }))
  const getItemsKey = (items: ChainItem[]) => JSON.stringify(getItemsToSave(items))
  const itemsKey = getItemsKey(items)
  const [savedItemsKey, setSavedItemsKey] = useState(itemsKey)

  const refreshActiveItem = useRefreshActiveItem()

  const saveItems = (items: ChainItem[]): Promise<number | undefined> => {
    setSavedItemsKey(getItemsKey(items))
    return saveChain(getItemsToSave(items), refreshActiveItem)
  }

  const saveItemsIfNeeded = itemsKey !== savedItemsKey ? () => saveItems(items) : undefined

  const [syncedVersionID, setSyncedVersionID] = useState(activeVersion.id)
  if (syncedVersionID !== activeVersion.id) {
    setSyncedVersionID(activeVersion.id)
    const newNodes = [InputNode, ...activeVersion.items, OutputNode] as ChainNode[]
    setNodes(newNodes)
    if (activeNodeIndex >= newNodes.length) {
      setActiveNodeIndex(1)
    }
    setSavedItemsKey(getItemsKey(activeVersion.items))
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
    setShowVersions(false)
  }

  const updateItems = (items: ChainItem[]) => setNodes([InputNode, ...items, OutputNode])

  const activateOutputNode = () => {
    setNodes(nodes => {
      setActiveNodeIndex(nodes.indexOf(OutputNode))
      return nodes
    })
  }

  const prepareForRunning = async (items: ChainItem[]): Promise<number> => {
    activateOutputNode()
    const versionID = await saveItems(items)
    return versionID!
  }

  const [showVersions, setShowVersions] = useState(false)

  const [activeRunID, selectComment] = useCommentSelection(activeVersion, setActiveVersion, activateOutputNode)

  const minWidth = 300
  return (
    <Allotment>
      {showVersions && (
        <Allotment.Pane minSize={minWidth} preferredSize={minWidth}>
          <div className='h-full'>
            <VersionTimeline
              activeItem={chain}
              versions={chain.versions}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              tabSelector={() => (
                <SingleTabHeader label='Version history'>
                  <IconButton icon={closeIcon} onClick={() => setShowVersions(false)} />
                </SingleTabHeader>
              )}
            />
          </div>
        </Allotment.Pane>
      )}
      <Allotment.Pane minSize={minWidth} preferredSize='50%'>
        <ChainEditor
          chain={chain}
          activeVersion={activeVersion}
          setActiveVersion={setActiveVersion}
          project={project}
          nodes={nodes}
          setNodes={setNodes}
          saveItems={saveItemsIfNeeded}
          activeIndex={activeNodeIndex}
          setActiveIndex={updateActiveNodeIndex}
          prompts={project.prompts}
          showVersions={showVersions}
          setShowVersions={setShowVersions}
        />
      </Allotment.Pane>
      {!showVersions && (
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
            activeRunID={activeRunID}
          />
        </Allotment.Pane>
      )}
      <Allotment.Pane minSize={showComments ? minWidth : 0} preferredSize={minWidth} visible={showComments}>
        <CommentsPane
          activeItem={chain}
          versions={chain.versions}
          onSelectComment={selectComment}
          showComments={showComments}
          setShowComments={setShowComments}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
