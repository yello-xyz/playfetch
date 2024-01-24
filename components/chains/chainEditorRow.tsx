import { ActiveChain, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode, IsBranchChainItem, IsChainItem } from './chainNode'
import { ChainNodeBox } from './chainNodeBox'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import { FirstBranchForBranchOfNode, ShouldBranchLoopOnCompletion } from '@/src/common/branching'
import ChainNodeBoxConnector, { DownArrow, DownStroke } from './chainNodeBoxConnector'

export type InsertActions = {
  insertItem: (index: number, branch: number, item: ChainItem) => void
  insertPrompt: (index: number, branch: number, promptID: number, versionID?: number) => void
  insertNewPrompt: (index: number, branch: number) => void
  insertCodeBlock: (index: number, branch: number) => void
  insertBranch: (index: number, branch: number) => void
  insertQuery?: (index: number, branch: number) => void
}

const bindInsertActions = (
  { insertPrompt, insertNewPrompt, insertCodeBlock, insertBranch, insertQuery }: InsertActions,
  index: number,
  branch: number
) => ({
  onInsertPrompt: (promptID: number) => insertPrompt(index, branch, promptID),
  onInsertNewPrompt: () => insertNewPrompt(index, branch),
  onInsertCodeBlock: () => insertCodeBlock(index, branch),
  onInsertBranch: () => insertBranch(index, branch),
  onInsertQuery: insertQuery ? () => insertQuery(index, branch) : undefined,
})

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
const didStartBranchInColumn = (nodes: ChainNode[], previousIndex: number, branch: number) =>
  nodes.slice(0, previousIndex).some(startsBranch(nodes, branch))

const shouldBranchLoopOnCompletion = (nodes: ChainNode[], branch: number) =>
  ShouldBranchLoopOnCompletion(nodes.filter(IsChainItem), branch)

export const ConnectorRow = (props: {
  nodes: ChainNode[]
  maxBranch: number
  maxNonLoopingBranch: number
  previousRow: ChainNode[]
  nextRow: ChainNode[]
  isDisabled: boolean
  activeMenuIndex?: [number, number]
  setActiveMenuIndex: (index: [number, number] | undefined) => void
  insertActions: InsertActions
  prompts: Prompt[]
}) => (
  <>
    {Array.from({ length: props.maxBranch + 1 }, (_, branch) => (
      <ConnectorCell key={branch} {...props} branch={branch} />
    ))}
  </>
)

const ConnectorCell = ({
  nodes,
  branch,
  maxNonLoopingBranch,
  previousRow,
  nextRow,
  isDisabled,
  activeMenuIndex,
  setActiveMenuIndex,
  insertActions,
  prompts,
}: {
  nodes: ChainNode[]
  branch: number
  maxNonLoopingBranch: number
  previousRow: ChainNode[]
  nextRow: ChainNode[]
  isDisabled: boolean
  activeMenuIndex?: [number, number]
  setActiveMenuIndex: (index: [number, number] | undefined) => void
  insertActions: InsertActions
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
  const isActive = index === activeMenuIndex?.[0] && branch === activeMenuIndex?.[1]
  const hasSpotOnNextRow = !nextNode && nodes.indexOf(nextRow[0]) !== nodes.length - 1
  const hasCompletedBranch = !nextNode && shouldBranchLoopOnCompletion(nodes, branch)
  return (precedingNode || isStartOfBranch) && index >= 0 ? (
    <ChainNodeBoxConnector
      prompts={prompts}
      isDisabled={isDisabled || (isActive && hasSpotOnNextRow)}
      isActive={isActive && !isDisabled}
      setActive={active => setActiveMenuIndex(active ? [index, branch] : undefined)}
      canDismiss={nodes.length > 2}
      hasPrevious={!!precedingNode && !IsBranchChainItem(precedingNode)}
      hasNext={!!nextNode && IsChainItem(nextNode)}
      hasCompleted={hasCompletedBranch}
      hasEndBranchConnector={maxNonLoopingBranch > 0}
      {...bindInsertActions(insertActions, index, branch)}
    />
  ) : didStartBranchInColumn(nodes, previousNodeIndex, branch) && !hasCompletedBranch ? (
    <DownStroke />
  ) : (
    <div />
  )
}

export const NodesRow = (props: {
  chain: ActiveChain
  nodes: ChainNode[]
  row: ChainNode[]
  maxBranch: number
  insertActions: InsertActions
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  activeMenuIndex?: [number, number]
  setActiveMenuIndex: (index: [number, number] | undefined) => void
  savedVersion: ChainVersion | null
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  promptCache: ChainPromptCache
}) => (
  <>
    {Array.from({ length: props.maxBranch + 1 }, (_, branch) => (
      <NodeCell key={branch} {...props} branch={branch} />
    ))}
  </>
)

const NodeCell = ({
  chain,
  nodes,
  row,
  branch,
  insertActions,
  saveItems,
  activeIndex,
  setActiveIndex,
  activeMenuIndex,
  setActiveMenuIndex,
  savedVersion,
  setTestMode,
  prompts,
  promptCache,
}: {
  chain: ActiveChain
  nodes: ChainNode[]
  row: ChainNode[]
  branch: number
  insertActions: InsertActions
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  activeMenuIndex?: [number, number]
  setActiveMenuIndex: (index: [number, number] | undefined) => void
  savedVersion: ChainVersion | null
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  promptCache: ChainPromptCache
}) => {
  const firstNodeOfRowIndex = nodes.indexOf(row[0])
  const isLastRow = firstNodeOfRowIndex === nodes.length - 1
  const node = row.find(sameBranch(branch))
  let index = node ? nodes.indexOf(node) : -1

  if (!node && !isLastRow && branch === activeMenuIndex?.[1]) {
    const rowItems = row.filter(IsChainItem)
    const nextNode = rowItems.find(item => item.branch > branch)
    const previousNode = rowItems.findLast(item => item.branch < branch)
    const nextIndex = nextNode ? nodes.indexOf(nextNode) : nodes.indexOf(previousNode!) + 1

    const didStartBranch = didStartBranchInColumn(nodes, firstNodeOfRowIndex, branch)
    const previousRowItems = nodes.slice(0, firstNodeOfRowIndex).filter(IsChainItem)
    const previousRowItem = previousRowItems.findLast(item => item.branch <= branch)
    const hasSpotOnPreviousRow =
      previousRowItem && previousRowItem.branch < branch && !startsBranch(nodes, branch)(previousRowItem)
    if (nextIndex === activeMenuIndex[0] && didStartBranch && !hasSpotOnPreviousRow) {
      index = nextIndex
    }
  }

  const hasCompletedBranch = !node && shouldBranchLoopOnCompletion(nodes, branch)

  return index >= 0 ? (
    node === undefined ? (
      <ChainNodeBoxConnector
        prompts={prompts}
        isDisabled={false}
        isActive={true}
        setActive={_ => setActiveMenuIndex(undefined)}
        canDismiss={true}
        hasPrevious={false}
        hasNext={false}
        hasCompleted={hasCompletedBranch}
        skipConnector
        {...bindInsertActions(insertActions, index, branch)}
      />
    ) : (
      <ChainNodeBox
        chain={chain}
        nodes={nodes}
        index={index}
        insertItem={item => insertActions.insertItem(index, branch, item)}
        saveItems={saveItems}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        savedVersion={savedVersion}
        setTestMode={setTestMode}
        prompts={prompts}
        promptCache={promptCache}
      />
    )
  ) : !isLastRow && !hasCompletedBranch && didStartBranchInColumn(nodes, firstNodeOfRowIndex, branch) ? (
    <DownStroke />
  ) : (
    <div />
  )
}

export const StartBranchConnector = ({
  maxBranch,
  row,
  nodes,
  colSpans,
}: {
  maxBranch: number
  row: ChainNode[]
  nodes: ChainNode[]
  colSpans: string[]
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
          <DownStroke key={branch} height='min-h-[18px]' spacer />
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

export const EndBranchConnector = ({
  maxBranch,
  maxNonLoopingBranch,
  colSpans,
}: {
  maxBranch: number
  maxNonLoopingBranch: number
  colSpans: string[]
}) => (
  <>
    <div
      className={`${colSpans[maxNonLoopingBranch]} border-t -mt-px mx-48 h-px border-gray-400 justify-self-stretch`}
    />
    <RowFiller start={maxNonLoopingBranch + 1} end={maxBranch} colSpans={colSpans} />
    <div className='flex flex-col items-center'>
      <DownArrow height='min-h-[18px]' />
    </div>
    <RowFiller start={1} end={maxBranch} colSpans={colSpans} />
  </>
)

const tinyLabelClass = 'text-white px-2 py-px text-[11px] font-medium'

export const StartRow = ({ maxBranch, colSpans }: { maxBranch: number; colSpans: string[] }) => (
  <>
    <div className={`${tinyLabelClass} bg-green-300 rounded-t mr-80`}>Start</div>
    <RowFiller start={1} end={maxBranch} colSpans={colSpans} />
  </>
)

export const EndRow = ({ maxBranch, colSpans }: { maxBranch: number; colSpans: string[] }) => (
  <>
    <div className={`${tinyLabelClass} bg-red-300 rounded-b ml-80`}>End</div>
    <RowFiller start={1} end={maxBranch} colSpans={colSpans} />
  </>
)

export const RowFiller = ({ start, end, colSpans }: { start: number; end: number; colSpans: string[] }) =>
  end + 1 > start ? <div className={colSpans[end - start]} /> : null
