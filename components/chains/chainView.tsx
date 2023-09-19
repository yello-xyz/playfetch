import { ActiveChain, ActiveProject, ChainItem, ChainItemWithInputs, ChainVersion } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import ChainNodeEditor from './chainNodeEditor'
import ChainEditor from './chainEditor'
import { ChainNode, InputNode, IsChainItem, IsCodeChainItem, OutputNode } from './chainNode'
import { Allotment } from 'allotment'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/refreshContext'
import CommentsPane from '../commentsPane'
import useCommentSelection from '@/src/client/hooks/useCommentSelection'
import VersionTimeline from '../versions/versionTimeline'
import { SingleTabHeader } from '../tabSelector'
import IconButton from '../iconButton'
import closeIcon from '@/public/close.svg'
import ChainNodeOutput, { ExtractChainItemVariables } from './chainNodeOutput'
import usePromptCache, { PromptCache } from '../../src/client/hooks/usePromptCache'

const StripItemsToSave = (items: ChainItem[]): ChainItem[] =>
  items.map(item => {
    return IsCodeChainItem(item)
      ? item
      : {
          ...item,
          activePrompt: undefined,
          version: undefined,
        }
  })

const AugmentItemsToSave = (items: ChainItem[], promptCache: PromptCache) =>
  items.map(item => {
    const inputs = ExtractChainItemVariables(item, promptCache, false)
    return IsCodeChainItem(item)
      ? { ...item, inputs }
      : {
          ...item,
          inputs,
          dynamicInputs: ExtractChainItemVariables(item, promptCache, true).filter(input => !inputs.includes(input)),
        }
  })

const GetItemsToSave = (items: ChainItem[], promptCache: PromptCache) =>
  AugmentItemsToSave(StripItemsToSave(items), promptCache)

export const GetChainItemsSaveKey = (items: ChainItem[]) => JSON.stringify(StripItemsToSave(items))

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

  const promptCache = usePromptCache(project, nodes, setNodes)
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>()

  const items = nodes.filter(IsChainItem)
  const itemsKey = GetChainItemsSaveKey(items)
  const [savedItemsKey, setSavedItemsKey] = useState(itemsKey)

  const refreshActiveItem = useRefreshActiveItem()

  const saveItems = (items: ChainItem[]): Promise<number | undefined> => {
    setSavedItemsKey(GetChainItemsSaveKey(items))
    return saveChain(GetItemsToSave(items, promptCache), refreshActiveItem)
  }

  const saveItemsIfNeeded = itemsKey !== savedItemsKey ? () => saveItems(items) : undefined

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

  const refreshProject = useRefreshProject()

  const addPrompt = async () => {
    const { promptID, versionID } = await api.addPrompt(project.id)
    refreshProject()
    return { promptID, versionID }
  }

  const [isNodeDirty, setNodeDirty] = useState(false)
  const updateActiveNodeIndex = (index: number) => {
    setActiveNodeIndex(index)
    setShowVersions(false)
    setNodeDirty(false)
  }

  const updateItems = (items: ChainItem[]) => setNodes([InputNode, ...items, OutputNode])

  const activateOutputNode = () => {
    setNodes(nodes => {
      setActiveNodeIndex(nodes.indexOf(OutputNode))
      return nodes
    })
  }

  const [showVersions, setShowVersions] = useState(false)
  const canShowVersions = chain.versions.length > 1 || chain.versions[0].didRun || chain.versions[0].items.length > 0
  chain.versions.filter(version => version.didRun).length > 0
  if (showVersions && !canShowVersions) {
    setShowVersions(false)
  }

  const [activeRunID, selectComment] = useCommentSelection(activeVersion, setActiveVersion, activateOutputNode)
  const [isTestMode, setTestMode] = useState(false)
  const updateTestMode = (testMode: boolean) => {
    setTestMode(testMode)
    if (testMode && activeNodeIndex === undefined) {
      setActiveNodeIndex(0)
    }
  }
  const isInputOutputNode = activeNodeIndex === 0 || activeNodeIndex === nodes.length - 1

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
          nodes={nodes}
          setNodes={setNodes}
          saveItems={saveItemsIfNeeded}
          activeIndex={activeNodeIndex}
          setActiveIndex={updateActiveNodeIndex}
          prompts={project.prompts}
          addPrompt={addPrompt}
          showVersions={showVersions}
          setShowVersions={canShowVersions ? setShowVersions : undefined}
          isTestMode={isTestMode}
          setTestMode={updateTestMode}
          disabled={!isTestMode && activeNodeIndex !== undefined && isNodeDirty}
          promptCache={promptCache}
        />
      </Allotment.Pane>
      {!showVersions && activeNodeIndex !== undefined && (isTestMode || !isInputOutputNode) && (
        <Allotment.Pane minSize={minWidth}>
          {isTestMode ? (
            <ChainNodeOutput
              chain={chain}
              activeVersion={activeVersion}
              nodes={nodes}
              activeIndex={activeNodeIndex}
              setActiveIndex={updateActiveNodeIndex}
              promptCache={promptCache}
              saveItems={items => saveItems(items).then(versionID => versionID!)}
              activeRunID={activeRunID}
              showRunButtons={isTestMode}
            />
          ) : (
            <ChainNodeEditor
              items={items}
              setItems={updateItems}
              activeIndex={activeNodeIndex - 1}
              setDirty={setNodeDirty}
              promptCache={promptCache}
              dismiss={() => setActiveNodeIndex(undefined)}
            />
          )}
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