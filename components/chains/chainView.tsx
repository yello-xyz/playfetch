import { ActiveChain, ChainItem, ChainItemWithInputs, ChainVersion } from '@/types'
import { useCallback, useState } from 'react'
import api from '@/src/client/api'
import ChainNodeEditor from './chainNodeEditor'
import ChainEditor from './chainEditor'
import { ChainNode, InputNode, IsChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import { Allotment } from 'allotment'
import { useActiveProject, useRefreshActiveItem, useRefreshProject } from '@/src/client/context/projectContext'
import VersionTimeline from '../versions/versionTimeline'
import { SingleTabHeader } from '../tabsHeader'
import IconButton from '../iconButton'
import closeIcon from '@/public/close.svg'
import ChainNodeOutput, { ExtractUnboundChainVariables } from './chainNodeOutput'
import useChainPromptCache from '../../src/client/hooks/useChainPromptCache'
import { OnSavedChain } from '@/src/client/hooks/useSaveChain'
import { GetChainItemsSaveKey, GetItemsToSave } from './chainItems'

export default function ChainView({
  chain,
  activeVersion,
  setActiveVersion,
  saveChain,
  focusRunID,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  setActiveVersion: (version: ChainVersion) => void
  saveChain: (items: ChainItemWithInputs[], onSaved?: OnSavedChain) => Promise<number | undefined>
  focusRunID?: number
}) {
  const [nodes, setNodes] = useState([InputNode, ...activeVersion.items, OutputNode] as ChainNode[])

  const activeProject = useActiveProject()
  const promptCache = useChainPromptCache(activeProject, nodes, setNodes)
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>()

  const items = nodes.filter(IsChainItem)
  const itemsKey = GetChainItemsSaveKey(items)
  const [savedItemsKey, setSavedItemsKey] = useState(itemsKey)

  const refreshActiveItem = useRefreshActiveItem()
  const refreshProject = useRefreshProject()

  const refreshOnSave = useCallback(async () => {
    await refreshActiveItem()
    const activeNode = activeNodeIndex !== undefined ? nodes[activeNodeIndex] : undefined
    if (activeNode && IsPromptChainItem(activeNode)) {
      await refreshProject()
      promptCache.refreshItem(activeNode.promptID)
    }
  }, [nodes, activeNodeIndex, promptCache, refreshActiveItem, refreshProject])

  const saveItems = (items: ChainItem[]): Promise<number | undefined> => {
    const loadedItems = items.filter(item => !IsPromptChainItem(item) || !!item.versionID)
    setSavedItemsKey(GetChainItemsSaveKey(loadedItems))
    return saveChain(GetItemsToSave(loadedItems, promptCache), refreshOnSave)
  }

  const [syncedVersionID, setSyncedVersionID] = useState(activeVersion.id)
  if (syncedVersionID !== activeVersion.id) {
    setSyncedVersionID(activeVersion.id)
    const newNodes = [InputNode, ...activeVersion.items, OutputNode] as ChainNode[]
    setNodes(newNodes)
    if (activeNodeIndex && activeNodeIndex >= newNodes.length) {
      setActiveNodeIndex(undefined)
    }
    setSavedItemsKey(GetChainItemsSaveKey(activeVersion.items))
  }

  const addPrompt = async () => {
    const promptID = await api.addPrompt(activeProject.id)
    refreshProject()
    return promptID
  }

  const isInputOutputIndex = (index: number | undefined, nodes: ChainNode[]) =>
    index === 0 || index === nodes.length - 1
  const isInputOutputNode = isInputOutputIndex(activeNodeIndex, nodes)
  const isUnloadedPromptNode = (node: ChainNode) => IsPromptChainItem(node) && !promptCache.promptForItem(node)

  const [isNodeDirty, setNodeDirty] = useState(false)
  const updateActiveNodeIndex = (index: number | undefined) => {
    setActiveNodeIndex(index)
    setShowVersions(false)
    setNodeDirty(false)
    setNodes(nodes => {
      if (isInputOutputIndex(index, nodes)) {
        setTestMode(true)
      }
      return nodes
    })
  }

  const updateItems = (items: ChainItem[]) => {
    const nodes = [InputNode, ...items, OutputNode] as ChainNode[]
    setNodes(nodes)
    saveItems(items)
    if (activeNodeIndex !== undefined && activeNodeIndex > nodes.length - 1) {
      setActiveNodeIndex(nodes.length - 1)
    }
  }

  const [showVersions, setShowVersions] = useState(false)
  const canShowVersions = chain.versions.length > 1 || chain.versions[0].didRun || chain.versions[0].items.length > 0
  chain.versions.filter(version => version.didRun).length > 0
  if (showVersions && !canShowVersions) {
    setShowVersions(false)
  }

  const [isTestMode, setTestMode] = useState(false)
  const updateTestMode = (testMode: boolean) => {
    setTestMode(testMode)
    if (testMode && activeNodeIndex === undefined) {
      updateActiveNodeIndex(0)
    } else if (showVersions && (testMode || (activeNodeIndex !== undefined && !isInputOutputNode))) {
      setShowVersions(false)
    }
  }

  const [lastFocusRunID, setLastFocusRunID] = useState<number>()
  if (focusRunID !== lastFocusRunID) {
    setLastFocusRunID(focusRunID)
    if (!isNodeDirty) {
      updateTestMode(true)
      setActiveNodeIndex(nodes.indexOf(OutputNode))
    }
  }

  const staticVariables = ExtractUnboundChainVariables(items, promptCache, false)

  const minWidth = 300
  return (
    <Allotment>
      {showVersions && (
        <Allotment.Pane minSize={minWidth} preferredSize={480}>
          <div className='h-full'>
            <VersionTimeline
              activeItem={chain}
              versions={chain.versions}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              tabSelector={children => (
                <SingleTabHeader label='Version history'>
                  <div className='flex items-center gap-1'>
                    {children}
                    <IconButton icon={closeIcon} onClick={() => setShowVersions(false)} />
                  </div>
                </SingleTabHeader>
              )}
              chainItemCache={promptCache}
            />
          </div>
        </Allotment.Pane>
      )}
      <Allotment.Pane minSize={minWidth} preferredSize='50%'>
        <ChainEditor
          chain={chain}
          activeVersion={activeVersion}
          isVersionSaved={itemsKey === savedItemsKey}
          nodes={nodes}
          saveItems={updateItems}
          activeIndex={activeNodeIndex}
          setActiveIndex={updateActiveNodeIndex}
          prompts={activeProject.prompts}
          addPrompt={addPrompt}
          showVersions={showVersions}
          setShowVersions={canShowVersions ? setShowVersions : undefined}
          isTestMode={isTestMode}
          setTestMode={updateTestMode}
          disabled={!isTestMode && activeNodeIndex !== undefined && isNodeDirty}
          promptCache={promptCache}
        />
      </Allotment.Pane>
      {!showVersions &&
        activeNodeIndex !== undefined &&
        (isTestMode || !isInputOutputNode) &&
        !isUnloadedPromptNode(nodes[activeNodeIndex]) && (
          <Allotment.Pane className='bg-gray-25' minSize={minWidth}>
            {isTestMode ? (
              <ChainNodeOutput
                chain={chain}
                activeVersion={activeVersion}
                nodes={nodes}
                activeIndex={activeNodeIndex}
                setActiveIndex={updateActiveNodeIndex}
                promptCache={promptCache}
                saveItems={items => saveItems(items).then(versionID => versionID!)}
                focusRunID={focusRunID}
                showRunButtons={isTestMode}
              />
            ) : (
              <ChainNodeEditor
                items={items}
                saveItems={updateItems}
                activeIndex={activeNodeIndex - 1}
                setDirty={setNodeDirty}
                promptCache={promptCache}
                dismiss={() => updateActiveNodeIndex(undefined)}
                variables={staticVariables}
              />
            )}
          </Allotment.Pane>
        )}
    </Allotment>
  )
}
