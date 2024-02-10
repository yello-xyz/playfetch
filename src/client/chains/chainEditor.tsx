import {
  ActiveChain,
  BranchChainItem,
  ChainItem,
  ChainVersion,
  CodeChainItem,
  Prompt,
  PromptChainItem,
  QueryChainItem,
} from '@/types'
import { ChainNode, IsBranchChainItem } from './chainNode'
import ChainEditorHeader from './chainEditorHeader'
import SegmentedControl, { Segment } from '../components/segmentedControl'
import { ChainItemCache } from '@/src/client/chains/useChainItemCache'
import { Fragment, useState } from 'react'
import { useCheckProviders } from '@/src/client/settings/providerContext'
import { EmbeddingModels, QueryProviders } from '@/src/common/providerMetadata'
import { MaxBranch, ShiftDown, ShiftRight, ShouldBranchLoopOnCompletion, SplitNodes } from '@/src/common/branching'
import { ConnectorRow, EndBranchConnector, EndRow, NodesRow, StartBranchConnector, StartRow } from './chainEditorRow'

export default function ChainEditor({
  chain,
  activeVersion,
  isVersionSaved,
  nodes,
  saveItems,
  activeIndex,
  setActiveIndex,
  prompts,
  addPrompt,
  showVersions,
  setShowVersions,
  isTestMode,
  setTestMode,
  disabled,
  itemCache,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  isVersionSaved: boolean
  nodes: ChainNode[]
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  prompts: Prompt[]
  addPrompt: () => Promise<number>
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
  isTestMode: boolean
  setTestMode: (testMode: boolean) => void
  disabled: boolean
  itemCache: ChainItemCache
}) {
  const [checkProviderAvailable, checkModelAvailable] = useCheckProviders()
  const provider = QueryProviders.find(provider => checkProviderAvailable(provider))
  const model = EmbeddingModels.find(model => checkModelAvailable(model))
  const defaultQueryConfig = provider && model ? { provider, model, indexName: '', query: '', topK: 1 } : undefined

  const [activeMenuIndex, setActiveMenuIndex] = useState<[number, number]>()

  if (nodes.length === 2 && !activeMenuIndex) {
    setActiveMenuIndex([1, 0])
  }

  const updateActiveIndex = (index: number) => {
    setActiveIndex(index)
    setActiveMenuIndex(undefined)
  }

  const items = nodes.slice(1, -1) as ChainItem[]

  const insertItem = (
    index: number,
    branch: number,
    item:
      | Omit<CodeChainItem, 'branch'>
      | Omit<BranchChainItem, 'branch'>
      | Omit<QueryChainItem, 'branch'>
      | Omit<PromptChainItem, 'branch'>
  ) => {
    const itemIndex = index - 1
    const itemWithBranch = { ...item, branch }
    let shiftedItems = IsBranchChainItem(itemWithBranch) ? ShiftRight(items, itemIndex, branch) : items
    shiftedItems = branch === items[itemIndex]?.branch ? ShiftDown(shiftedItems, itemIndex) : shiftedItems
    saveItems([...shiftedItems.slice(0, itemIndex), itemWithBranch, ...shiftedItems.slice(itemIndex)])
    updateActiveIndex(index)
  }

  const insertPrompt = (index: number, branch: number, promptID: number, versionID?: number) =>
    insertItem(index, branch, {
      promptID,
      versionID: versionID ?? itemCache.versionForItem({ promptID })?.id,
    })

  const insertNewPrompt = (index: number, branch: number) =>
    addPrompt().then(promptID => insertPrompt(index, branch, promptID))

  const insertCodeBlock = (index: number, branch: number) => insertItem(index, branch, { code: '' })
  const insertBranch = (index: number, branch: number) =>
    insertItem(index, branch, { code: '', branches: ['left', 'right'] })
  const insertQuery = defaultQueryConfig
    ? (index: number, branch: number) => insertItem(index, branch, { ...defaultQueryConfig })
    : undefined

  const insertActions = { insertItem, insertPrompt, insertNewPrompt, insertCodeBlock, insertBranch, insertQuery }

  const nodeRows = [[nodes[0]], ...SplitNodes(items), [nodes.slice(-1)[0]]]
  const maxBranch = Math.min(MaxBranch(items), gridConfigs.length)
  const maxNonLoopingBranch = Array.from({ length: maxBranch + 1 }).findLastIndex(
    (_, branch) => !ShouldBranchLoopOnCompletion(items, branch)
  )

  return (
    <div className='relative flex flex-col items-stretch h-full bg-gray-25'>
      <ChainEditorHeader
        chain={chain}
        activeVersion={activeVersion}
        isVersionSaved={isVersionSaved}
        showVersions={showVersions}
        setShowVersions={setShowVersions}
      />
      <div className='flex flex-col h-full bg-local bg-[url("/dotPattern.png")] bg-[length:18px_18px] overflow-auto'>
        <div className={`relative p-8 m-auto min-w-max grid ${gridConfigs[maxBranch]} gap-x-8 justify-items-center`}>
          <StartRow maxBranch={maxBranch} colSpans={colSpans} />
          {nodeRows.map((row, rowIndex, rows) => (
            <Fragment key={rowIndex}>
              {rowIndex === rows.length - 1 && (
                <EndBranchConnector
                  maxBranch={maxBranch}
                  maxNonLoopingBranch={maxNonLoopingBranch}
                  colSpans={colSpans}
                />
              )}
              <NodesRow
                chain={chain}
                nodes={nodes}
                row={row}
                maxBranch={maxBranch}
                insertActions={insertActions}
                saveItems={saveItems}
                activeIndex={activeIndex}
                setActiveIndex={updateActiveIndex}
                activeMenuIndex={activeMenuIndex}
                setActiveMenuIndex={setActiveMenuIndex}
                savedVersion={isVersionSaved ? activeVersion : null}
                setTestMode={setTestMode}
                prompts={prompts}
                itemCache={itemCache}
              />
              {<StartBranchConnector row={row} maxBranch={maxBranch} nodes={nodes} colSpans={colSpans} />}
              {rowIndex < rows.length - 1 && (
                <ConnectorRow
                  nodes={nodes}
                  previousRow={row}
                  nextRow={rows[rowIndex + 1]}
                  maxBranch={maxBranch}
                  maxNonLoopingBranch={maxNonLoopingBranch}
                  prompts={prompts}
                  isDisabled={isTestMode}
                  activeMenuIndex={activeMenuIndex}
                  setActiveMenuIndex={setActiveMenuIndex}
                  insertActions={insertActions}
                />
              )}
            </Fragment>
          ))}
          <EndRow maxBranch={maxBranch} colSpans={colSpans} />
        </div>
      </div>
      <SegmentedControl
        className='absolute z-30 bottom-4 right-4'
        selected={isTestMode}
        callback={setTestMode}
        disabled={disabled}>
        <Segment title='Edit' value={false} />
        <Segment title='Test' value={true} />
      </SegmentedControl>
      {disabled && <div className='absolute inset-0 z-30 w-full h-full bg-gray-300 opacity-20' />}
    </div>
  )
}

const gridConfigs = [
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',
  'grid-cols-5',
  'grid-cols-6',
  'grid-cols-7',
  'grid-cols-8',
  'grid-cols-9',
  'grid-cols-10',
  'grid-cols-11',
  'grid-cols-12',
]

const colSpans = [
  'col-span-1',
  'col-span-2',
  'col-span-3',
  'col-span-4',
  'col-span-5',
  'col-span-6',
  'col-span-7',
  'col-span-8',
  'col-span-9',
  'col-span-10',
  'col-span-11',
  'col-span-12',
]
