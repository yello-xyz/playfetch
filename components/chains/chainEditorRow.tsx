import { ActiveChain, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode, IsBranchChainItem, IsChainItem } from './chainNode'
import { ChainNodeBox } from './chainNodeBox'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import { FirstBranchForBranchOfNode } from '@/src/common/branching'
import ChainNodeBoxConnector, { DownConnector, DownStroke } from './chainNodeBoxConnector'

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

export const ConnectorRow = ({
  nodes,
  maxBranch,
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
  maxBranch: number
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
}) => (
  <>
    {Array.from({ length: maxBranch + 1 }, (_, branch) => (
      <ConnectorCell
        key={branch}
        nodes={nodes}
        previousRow={previousRow}
        nextRow={nextRow}
        branch={branch}
        prompts={prompts}
        isDisabled={isDisabled}
        activeMenuIndex={activeMenuIndex}
        setActiveMenuIndex={setActiveMenuIndex}
        insertPrompt={insertPrompt}
        insertNewPrompt={insertNewPrompt}
        insertCodeBlock={insertCodeBlock}
        insertBranch={insertBranch}
        insertQuery={insertQuery}
      />
    ))}
  </>
)

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

export const NodesRow = ({
  chain,
  nodes,
  row,
  maxBranch,
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
  maxBranch: number
  insertItem: (index: number, branch: number, item: ChainItem) => void
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  savedVersion: ChainVersion | null
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  promptCache: ChainPromptCache
}) => (
  <>
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
        setActiveIndex={setActiveIndex}
        savedVersion={savedVersion}
        setTestMode={setTestMode}
        prompts={prompts}
        promptCache={promptCache}
      />
    ))}
  </>
)

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

export const StartBranchConnector = ({
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

export const EndBranchConnector = ({ maxBranch }: { maxBranch: number }) => (
  <>
    <div className={`${colSpans[maxBranch]} border-t -mt-px mx-48 h-px border-gray-400 justify-self-stretch`} />
    <div className='flex flex-col items-center'>
      <DownConnector height='min-h-[18px]' />
    </div>
    <RowFiller start={1} end={maxBranch} />
  </>
)

const tinyLabelClass = 'text-white px-2 py-px text-[11px] font-medium'

export const StartRow = ({ maxBranch }: { maxBranch: number }) => (
  <>
    <div className={`${tinyLabelClass} bg-green-300 rounded-t mr-80`}>Start</div>
    <RowFiller start={1} end={maxBranch} />
  </>
)

export const EndRow = ({ maxBranch }: { maxBranch: number }) => (
  <>
    <div className={`${tinyLabelClass} bg-red-300 rounded-b ml-80`}>End</div>
    <RowFiller start={1} end={maxBranch} />
  </>
)

export const RowFiller = ({ start, end }: { start: number; end: number }) =>
  end + 1 > start ? <div className={colSpans[end + 1 - start]} /> : null

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
