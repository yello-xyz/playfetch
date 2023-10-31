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
import {
  FirstBranchForBranchOfNode,
  MaxBranch,
  ShiftDown,
  ShiftRight,
  SplitNodes,
  SubtreeForNode,
} from '@/src/common/branching'
import ChainNodeBoxConnector, { DownConnector, DownStroke } from './chainNodeBoxConnector'

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
      versionID: versionID ?? promptCache.versionForItem({ promptID })?.id,
    })

  const insertNewPrompt = (index: number, branch: number) =>
    addPrompt().then(({ promptID, versionID }) => insertPrompt(index, branch, promptID, versionID))

  const insertCodeBlock = (index: number, branch: number) => insertItem(index, branch, { code: '' })
  const insertBranch = (index: number, branch: number) =>
    insertItem(index, branch, { code: '', branches: ['left', 'right'] })
  const insertQuery = defaultQueryConfig
    ? (index: number, branch: number) => insertItem(index, branch, { ...defaultQueryConfig })
    : undefined

  const tinyLabelClass = 'text-white px-2 py-px text-[11px] font-medium'

  const nodeRows = [[nodes[0]], ...SplitNodes(items), [nodes.slice(-1)[0]]]
  const maxBranch = Math.min(MaxBranch(items), gridConfigs.length)
  const gridConfig = gridConfigs[maxBranch]

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
              {rowIndex === rows.length - 1 && <EndBranchConnector maxBranch={maxBranch} />}
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
              {<StartBranchConnector row={row} maxBranch={maxBranch} nodes={nodes} />}
              {rowIndex < rows.length - 1 &&
                Array.from({ length: maxBranch + 1 }, (_, branch) => (
                  <ConnectorCell
                    key={branch}
                    nodes={nodes}
                    previousRow={row}
                    nextRow={rows[rowIndex + 1]}
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

const sameBranch = (branch: number) => (node: ChainNode) => (IsChainItem(node) ? node.branch : 0) === branch
const startsBranch = (nodes: ChainNode[], branch: number) => (node: ChainNode) => {
  const items = nodes.filter(IsChainItem)
  return (
    IsBranchChainItem(node) &&
    node.branches.some(
      (_, branchIndex) => FirstBranchForBranchOfNode(items, items.indexOf(node), branchIndex) === branch
    )
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
  activeMenuIndex?: [number, number]
  setActiveMenuIndex: (index: [number, number] | undefined) => void
  insertPrompt: (index: number, branch: number, promptID: number) => void
  insertNewPrompt: (index: number, branch: number) => void
  insertQuery?: (index: number, branch: number) => void
  insertCodeBlock: (index: number, branch: number) => void
  insertBranch: (index: number, branch: number) => void
  prompts: Prompt[]
}) => {
  const precedingNode = previousRow.find(sameBranch(branch))
  const isStartOfBranch = previousRow.some(startsBranch(nodes, branch))
  const previousNodes = [...previousRow, ...nextRow.filter(node => IsChainItem(node) && node.branch < branch)]
  const previousNodeIndex = nodes.indexOf(previousNodes.slice(-1)[0])
  const nextNode = nextRow.find(sameBranch(branch))
  let index = nextNode ? nodes.indexOf(nextNode) : -1
  if (index < 0) {
    const targetNode = nextRow.find(node => !IsChainItem(node) || node.branch > branch)
    index = targetNode ? nodes.indexOf(targetNode) : previousNodeIndex + 1
  }
  const hasStartedBranchInColumn = nodes.slice(0, previousNodeIndex).some(startsBranch(nodes, branch))
  return (precedingNode || isStartOfBranch) && index >= 0 ? (
    <ChainNodeBoxConnector
      prompts={prompts}
      isDisabled={isDisabled}
      isActive={index === activeMenuIndex?.[0] && branch === activeMenuIndex?.[1]}
      setActive={active => setActiveMenuIndex(active ? [index, branch] : undefined)}
      canDismiss={nodes.length > 2}
      hasPrevious={!!precedingNode && !IsBranchChainItem(precedingNode)}
      hasNext={!!nextNode && IsChainItem(nextNode)}
      onInsertPrompt={promptID => insertPrompt(index, branch, promptID)}
      onInsertNewPrompt={() => insertNewPrompt(index, branch)}
      onInsertCodeBlock={() => insertCodeBlock(index, branch)}
      onInsertBranch={() => insertBranch(index, branch)}
      onInsertQuery={insertQuery ? () => insertQuery(index, branch) : undefined}
    />
  ) : hasStartedBranchInColumn ? (
    <DownStroke />
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
  insertItem: (index: number, branch: number, item: ChainItem) => void
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  savedVersion: ChainVersion | null
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  promptCache: ChainPromptCache
}) => {
  const node = row.find(sameBranch(branch))
  const index = node ? nodes.indexOf(node) : -1
  const firstNodeOfRowIndex = nodes.indexOf(row[0])
  const isLastRow = firstNodeOfRowIndex === nodes.length - 1
  const hasStartedBranchInColumn = nodes.slice(0, firstNodeOfRowIndex).some(startsBranch(nodes, branch))
  return index >= 0 ? (
    <ChainNodeBox
      chain={chain}
      nodes={nodes}
      index={index}
      insertItem={item => insertItem(index, branch, item)}
      saveItems={saveItems}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      savedVersion={savedVersion}
      setTestMode={setTestMode}
      prompts={prompts}
      promptCache={promptCache}
    />
  ) : !isLastRow && hasStartedBranchInColumn ? (
    <DownStroke />
  ) : (
    <div />
  )
}

const StartBranchConnector = ({
  maxBranch,
  row,
  nodes,
}: {
  maxBranch: number
  row: ChainNode[]
  nodes: ChainNode[]
}) => {
  const items = nodes.filter(IsChainItem)
  const ranges = row
    .filter(IsBranchChainItem)
    .map(node => [node.branch, FirstBranchForBranchOfNode(items, items.indexOf(node), node.branches.length - 1)])
  const rangeForBranch = (branch: number) => ranges.find(([start, end]) => start <= branch && branch <= end)
  const hasRangeAtBranch = (branch: number) => !!rangeForBranch(branch)
  const rangeStartsAtBranch = (branch: number) => rangeForBranch(branch)?.[0] === branch
  const colSpanForBranch = (branch: number) => {
    const range = rangeForBranch(branch) ?? [0, 0]
    return colSpans[range[1] - range[0]]
  }
  const firstNodeOfRowIndex = nodes.indexOf(row[0])
  const hasStartedBranchInColumn = (branch: number) =>
    nodes.slice(0, firstNodeOfRowIndex).some(startsBranch(nodes, branch))
  return (
    <>
      {Array.from({ length: maxBranch + 1 }, (_, branch) =>
        rangeStartsAtBranch(branch) ? (
          <div key={branch} className='flex flex-col items-center'>
            <DownStroke height='min-h-[18px]' includeDot />
          </div>
        ) : hasStartedBranchInColumn(branch) ? (
          <DownStroke key={branch} />
        ) : (
          <div key={branch} />
        )
      )}
      {Array.from({ length: maxBranch + 1 }, (_, branch) =>
        rangeStartsAtBranch(branch) ? (
          <div
            key={branch}
            className={`${colSpanForBranch(branch)} border-t -mt-px mx-48 h-px border-gray-400 justify-self-stretch`}
          />
        ) : hasRangeAtBranch(branch) ? null : (
          <div key={branch} />
        )
      )}
    </>
  )
}

const EndBranchConnector = ({ maxBranch }: { maxBranch: number }) => (
  <>
    <div className={`${colSpans[maxBranch]} border-t -mt-px mx-48 h-px border-gray-400 justify-self-stretch`} />
    <div className='flex flex-col items-center'>
      <DownConnector height='min-h-[18px]' />
    </div>
    <RowFiller start={1} end={maxBranch} />
  </>
)

const RowFiller = ({ start, end }: { start: number; end: number }) =>
  end + 1 > start ? <div className={colSpans[end + 1 - start]} /> : null

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
