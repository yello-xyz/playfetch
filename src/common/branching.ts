import { ChainItem } from '@/types'
import { IsBranchChainItem } from '@/components/chains/chainNode'

export const IsSiblingNode = (nodes: ChainItem[], index: number): boolean => {
  if (index <= 0 || index > nodes.length - 1) {
    return false
  }
  const node = nodes[index]
  const previousNode = nodes[index - 1]
  return node.branch > previousNode.branch + (IsBranchChainItem(previousNode) ? previousNode.branches.length - 1 : 0)
}

export const SubtreeForNode = (nodes: ChainItem[], index: number, includingRoot = true): ChainItem[] => {
  if (index < 0 || index > nodes.length - 1) {
    return []
  }
  const lowerBound = nodes[index].branch - 1
  const upperBound = IsSiblingNode(nodes, index + 1) ? nodes[index + 1].branch : Infinity
  return nodes
    .slice(index + (includingRoot ? 0 : 1))
    .filter(node => node.branch > lowerBound && node.branch < upperBound)
}

const SubtreeAndFirstBranchForBranchOfNode = (nodes: ChainItem[], index: number, branchIndex: number) => {
  const descendants = SubtreeForNode(nodes, index, false)
  const children = takeWhile(descendants, (_, index) => index === 0 || IsSiblingNode(descendants, index))

  let branch = nodes[index]?.branch
  let branches = [] as ChainItem[][]
  let startBranches = [] as number[]
  for (const [childIndex, child] of children.entries()) {
    while (branch < child.branch) {
      startBranches.push(branch)
      branches.push([])
      branch++
    }
    const subtree = SubtreeForNode(descendants, childIndex)
    startBranches.push(branch)
    branches.push(subtree)
    branch = 1 + MaxBranch(subtree)
  }
  while (branches.length <= branchIndex) {
    startBranches.push(branch)
    branches.push([])
    branch++
  }

  return [branches[branchIndex], startBranches[branchIndex]] as const
}

const takeWhile = <T>(array: T[], predicate: (value: T, index: number) => boolean) => {
  const result = []
  for (let index = 0; index < array.length; ++index) {
    const value = array[index]
    if (!predicate(value, index)) {
      break
    }
    result.push(value)
  }
  return result
}

export const SubtreeForBranchOfNode = (nodes: ChainItem[], index: number, branchIndex: number): ChainItem[] => {
  const [subtree] = SubtreeAndFirstBranchForBranchOfNode(nodes, index, branchIndex)
  return subtree
}

export const FirstBranchForBranchOfNode = (nodes: ChainItem[], index: number, branchIndex: number): number => {
  const [, firstBranch] = SubtreeAndFirstBranchForBranchOfNode(nodes, index, branchIndex)
  return firstBranch
}

export const MaxBranch = (nodes: ChainItem[]): number =>
  nodes.reduce((max, node) => max + (IsBranchChainItem(node) ? node.branches.length - 1 : 0), nodes[0]?.branch ?? 0)

export const SplitNodes = (nodes: ChainItem[]): ChainItem[][] => {
  const splits = [] as ChainItem[][]
  let split = [] as ChainItem[]
  for (const [index, node] of nodes.entries()) {
    if (!IsSiblingNode(nodes, index) && split.length > 0) {
      splits.push(split)
      split = []
    }
    split.push(node)
  }
  if (split.length > 0) {
    splits.push(split)
  }
  return splits
}

const ShiftHorizontally = (nodes: ChainItem[], threshold: number, positions: number): ChainItem[] =>
  nodes.map(node => (node.branch > threshold ? { ...node, branch: node.branch + positions } : node))

export const ShiftRight = (nodes: ChainItem[], index: number): ChainItem[] => {
  const maxSubTreeBranch = MaxBranch(SubtreeForNode(nodes, index))
  return ShiftHorizontally(nodes, maxSubTreeBranch, 1)
}

export const PruneBranchAndShiftLeft = (items: ChainItem[], index: number, branchIndex: number) => {
  const subtree = SubtreeForBranchOfNode(items, index, branchIndex)
  if (subtree.length === 0) {
    return items
  }
  const maxBranch = MaxBranch(subtree)
  const branchDecrease = maxBranch - FirstBranchForBranchOfNode(items, index, branchIndex)
  return ShiftHorizontally(
    items.filter(node => !subtree.includes(node)),
    maxBranch,
    -branchDecrease
  )
}

export const ShiftVerically = (nodes: ChainItem[], index: number, offset: number, pruneRoot: boolean): ChainItem[] => {
  const splits = SplitNodes(nodes)

  const subtree = SubtreeForNode(nodes, index)
  const leftBranch = Math.min(...subtree.map(node => node.branch))
  const rightBranch = MaxBranch(subtree)
  const inSubtree = (node: ChainItem) => subtree.includes(node)

  const resultSplits = [] as ChainItem[][]
  for (const [splitIndex, split] of [...splits, []].entries()) {
    const offsetIndex = splitIndex + offset
    const offsetSplit = offsetIndex >= 0 && offsetIndex < splits.length ? splits[offsetIndex] : []
    const offsetSubSplit = offsetSplit.filter(inSubtree).filter(item => !pruneRoot || item !== nodes[index])
    const subSplit = split.filter(inSubtree)
    resultSplits.push(
      subSplit.length > 0 || offsetSubSplit.length > 0
        ? [
            ...split.filter(node => node.branch < leftBranch),
            ...offsetSubSplit,
            ...split.filter(node => node.branch > rightBranch),
          ]
        : split
    )
  }

  return resultSplits.filter(split => split.length > 0).flat()
}
export const ShiftDown = (nodes: ChainItem[], index: number): ChainItem[] => ShiftVerically(nodes, index, -1, false)

export const PruneNodeAndShiftUp = (nodes: ChainItem[], index: number): ChainItem[] =>
  ShiftVerically(nodes, index, 1, true)
