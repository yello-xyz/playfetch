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
import { ChainNode, IsBranchChainItem, IsChainItem } from './chainNode'
import ChainEditorHeader from './chainEditorHeader'
import SegmentedControl, { Segment } from '../segmentedControl'
import { ChainNodeBox } from './chainNodeBox'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import { Fragment, useState } from 'react'
import { useCheckProviders } from '@/src/client/hooks/useAvailableProviders'
import { EmbeddingModels, QueryProviders } from '@/src/common/providerMetadata'
import { MaxBranch, ShiftDown, ShiftRight, SplitNodes, SubtreeForBranchOfNode } from '@/src/common/branching'
import ChainNodeBoxConnector from './chainNodeBoxConnector'

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
  promptCache,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  isVersionSaved: boolean
  nodes: ChainNode[]
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  prompts: Prompt[]
  addPrompt: () => Promise<{ promptID: number; versionID: number }>
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
  isTestMode: boolean
  setTestMode: (testMode: boolean) => void
  disabled: boolean
  promptCache: ChainPromptCache
}) {
  const [checkProviderAvailable, checkModelAvailable] = useCheckProviders()
  const provider = QueryProviders.find(provider => checkProviderAvailable(provider))
  const model = EmbeddingModels.find(model => checkModelAvailable(model))
  const defaultQueryConfig = provider && model ? { provider, model, indexName: '', query: '', topK: 1 } : undefined

  const [activeMenuIndex, setActiveMenuIndex] = useState<number>()

  if (nodes.length === 2 && !activeMenuIndex) {
    setActiveMenuIndex(1)
  }

  const updateActiveIndex = (index: number) => {
    setActiveIndex(index)
    setActiveMenuIndex(undefined)
  }

  const items = nodes.slice(1, -1) as ChainItem[]

  const insertItem = (
    index: number,
    item:
      | Omit<CodeChainItem, 'branch'>
      | Omit<BranchChainItem, 'branch'>
      | Omit<QueryChainItem, 'branch'>
      | Omit<PromptChainItem, 'branch'>
  ) => {
    const itemIndex = index - 1
    const itemWithBranch = { ...item, branch: items[itemIndex]?.branch ?? 0 }
    const shiftedItems = ShiftDown(IsBranchChainItem(itemWithBranch) ? ShiftRight(items, itemIndex) : items, itemIndex)
    saveItems([...shiftedItems.slice(0, itemIndex), itemWithBranch, ...shiftedItems.slice(itemIndex)])
    updateActiveIndex(index)
  }

  const insertPrompt = (index: number, promptID: number, versionID?: number) =>
    insertItem(index, {
      promptID,
      versionID: versionID ?? promptCache.versionForItem({ promptID })?.id,
    })

  const insertNewPrompt = (index: number) =>
    addPrompt().then(({ promptID, versionID }) => insertPrompt(index, promptID, versionID))

  const insertCodeBlock = (index: number) => insertItem(index, { code: '' })
  const insertBranch = (index: number) => insertItem(index, { code: '', branches: ['left', 'right'] })
  const insertQuery = defaultQueryConfig ? (index: number) => insertItem(index, { ...defaultQueryConfig }) : undefined

  const tinyLabelClass = 'text-white px-2 py-px text-[11px] font-medium'

  const nodeRows = [[nodes[0]], ...SplitNodes(items), [nodes.slice(-1)[0]]]
  const maxBranch = MaxBranch(items)
  const gridConfig = gridConfigs[Math.min(maxBranch, gridConfigs.length - 1)]

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
        <div className={`relative p-8 m-auto min-w-max grid ${gridConfig} gap-x-8 justify-items-center`}>
          <div className={`${tinyLabelClass} bg-green-300 rounded-t mr-80`}>Start</div>
          <RowFiller start={1} end={maxBranch} />
          {nodeRows.map((row, rowIndex, rows) => (
            <Fragment key={rowIndex}>
              {rowIndex > 0 &&
                Array.from({ length: maxBranch + 1 }, (_, branch) => (
                  <ConnectorCell
                    key={branch}
                    nodes={nodes}
                    previousRow={rows[rowIndex - 1]}
                    nextRow={row}
                    branch={branch}
                    prompts={prompts}
                    isDisabled={isTestMode}
                    activeMenuIndex={activeMenuIndex}
                    setActiveMenuIndex={setActiveMenuIndex}
                    insertPrompt={insertPrompt}
                    insertNewPrompt={insertNewPrompt}
                    insertCodeBlock={insertCodeBlock}
                    insertBranch={insertBranch}
                    insertQuery={insertQuery}
                  />
                ))}
              {Array.from({ length: maxBranch + 1 }, (_, branch) => (
                <NodeCell
                  key={branch}
                  chain={chain}
                  nodes={nodes}
                  row={row}
                  branch={branch}
                  insertItem={insertItem}
                  saveItems={saveItems}
                  activeIndex={activeIndex}
                  setActiveIndex={updateActiveIndex}
                  savedVersion={isVersionSaved ? activeVersion : null}
                  setTestMode={setTestMode}
                  prompts={prompts}
                  promptCache={promptCache}
                />
              ))}
            </Fragment>
          ))}
          <div className={`${tinyLabelClass} bg-red-300 rounded-b ml-80`}>End</div>
          <RowFiller start={1} end={maxBranch} />
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

const ConnectorCell = ({
  nodes,
  branch,
  previousRow,
  nextRow,
  isDisabled,
  activeMenuIndex,
  setActiveMenuIndex,
  insertPrompt,
  insertNewPrompt,
  insertQuery,
  insertCodeBlock,
  insertBranch,
  prompts,
}: {
  nodes: ChainNode[]
  branch: number
  previousRow: ChainNode[]
  nextRow: ChainNode[]
  isDisabled: boolean
  activeMenuIndex?: number
  setActiveMenuIndex: (index: number | undefined) => void
  insertPrompt: (index: number, promptID: number) => void
  insertNewPrompt: (index: number) => void
  insertQuery?: (index: number) => void
  insertCodeBlock: (index: number) => void
  insertBranch: (index: number) => void
  prompts: Prompt[]
}) => {
  let nextNode = nextRow.find(node => (IsChainItem(node) ? node.branch : 0) === branch)
  let index = nextNode ? nodes.indexOf(nextNode) : -1
  if (index < 0) {
    const items = nodes.filter(IsChainItem)
    const isStartOfBranch = previousRow.some(
      node =>
        IsBranchChainItem(node) &&
        node.branches
          .slice(-1)
          .some(
            (_, branchIndex) =>
              MaxBranch(SubtreeForBranchOfNode(items, nodes.indexOf(node), branchIndex)) + 1 === branch
          )
    )
    if (isStartOfBranch) {
      const previousNodes = [...previousRow, ...nextRow.filter(node => IsChainItem(node) && node.branch < branch)]
      nextNode = nextRow.find(node => !IsBranchChainItem(node) || node.branch > branch)
      index = nextNode ? nodes.indexOf(nextNode) : nodes.indexOf(previousNodes.slice(-1)[0]) + 1
    }
  }
  return index >= 0 ? (
    <ChainNodeBoxConnector
      prompts={prompts}
      isDisabled={isDisabled}
      isActive={index === activeMenuIndex}
      setActive={active => setActiveMenuIndex(active ? index : undefined)}
      canDismiss={nodes.length > 2}
      onInsertPrompt={promptID => insertPrompt(index, promptID)}
      onInsertNewPrompt={() => insertNewPrompt(index)}
      onInsertCodeBlock={() => insertCodeBlock(index)}
      onInsertBranch={() => insertBranch(index)}
      onInsertQuery={insertQuery ? () => insertQuery(index) : undefined}
    />
  ) : (
    <div />
  )
}

const NodeCell = ({
  chain,
  nodes,
  row,
  branch,
  insertItem,
  saveItems,
  activeIndex,
  setActiveIndex,
  savedVersion,
  setTestMode,
  prompts,
  promptCache,
}: {
  chain: ActiveChain
  nodes: ChainNode[]
  row: ChainNode[]
  branch: number
  insertItem: (index: number, item: ChainItem) => void
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  savedVersion: ChainVersion | null
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  promptCache: ChainPromptCache
}) => {
  const node = row.find(node => (IsChainItem(node) ? node.branch : 0) === branch)
  const index = node ? nodes.indexOf(node) : -1
  return index >= 0 ? (
    <ChainNodeBox
      chain={chain}
      nodes={nodes}
      index={index}
      insertItem={item => insertItem(index, item)}
      saveItems={saveItems}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      savedVersion={savedVersion}
      setTestMode={setTestMode}
      prompts={prompts}
      promptCache={promptCache}
    />
  ) : (
    <div />
  )
}

const RowFiller = ({ start, end }: { start: number; end: number }) => (
  <>
    {Array.from({ length: end + 1 - start }, (_, index) => (
      <div key={index + start} />
    ))}
  </>
)

const gridConfigs = [
  'grid-cols-[repeat(1,minmax(0,1fr))]',
  'grid-cols-[repeat(2,minmax(0,1fr))]',
  'grid-cols-[repeat(3,minmax(0,1fr))]',
  'grid-cols-[repeat(4,minmax(0,1fr))]',
  'grid-cols-[repeat(5,minmax(0,1fr))]',
  'grid-cols-[repeat(6,minmax(0,1fr))]',
  'grid-cols-[repeat(7,minmax(0,1fr))]',
  'grid-cols-[repeat(8,minmax(0,1fr))]',
  'grid-cols-[repeat(9,minmax(0,1fr))]',
  'grid-cols-[repeat(10,minmax(0,1fr))]',
  'grid-cols-[repeat(11,minmax(0,1fr))]',
  'grid-cols-[repeat(12,minmax(0,1fr))]',
  'grid-cols-[repeat(13,minmax(0,1fr))]',
  'grid-cols-[repeat(14,minmax(0,1fr))]',
  'grid-cols-[repeat(15,minmax(0,1fr))]',
  'grid-cols-[repeat(16,minmax(0,1fr))]',
  'grid-cols-[repeat(17,minmax(0,1fr))]',
  'grid-cols-[repeat(18,minmax(0,1fr))]',
  'grid-cols-[repeat(19,minmax(0,1fr))]',
  'grid-cols-[repeat(20,minmax(0,1fr))]',
]
