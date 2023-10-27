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

export const SubtreeForBranchOfNode = (nodes: ChainItem[], index: number, branchIndex: number): ChainItem[] => {
  const descendants = SubtreeForNode(nodes, index, false)
  const children = takeWhile(descendants, (_, index) => index === 0 || IsSiblingNode(descendants, index))

  let branch = nodes[index]?.branch
  let branches = [] as ChainItem[][]
  for (const [childIndex, child] of children.entries()) {
    while (branch < child.branch) {
      branches.push([])
      branch++
    }  
    const subtree = SubtreeForNode(descendants, childIndex)
    branches.push(subtree)
    branch = 1 + Math.max(...subtree.map(node => node.branch))
  }
  
  return branchIndex < branches.length ? branches[branchIndex] : []
}

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

export const ShiftRight = (nodes: ChainItem[], index: number): ChainItem[] => {
  const maxSubTreeBranch = Math.max(-1, ...SubtreeForNode(nodes, index).map(node => node.branch))
  return nodes.map(node => node.branch > maxSubTreeBranch ? ({ ...node, branch: node.branch + 1 }) : node)
}

export const ShiftDown = (nodes: ChainItem[], index: number): ChainItem[] => {
  const splits = SplitNodes(nodes)

  const subtree = SubtreeForNode(nodes, index)
  const leftBranch = Math.min(...subtree.map(node => node.branch))
  const rightBranch = Math.max(...subtree.map(node => node.branch))
  const inSubtree = (node: ChainItem) => subtree.includes(node)

  const resultSplits = [] as ChainItem[][]
  for (const [index, split] of [...splits, []].entries()) {
    const previousSplit = index > 0 ? splits[index - 1] : []
    const previousSubSplit = previousSplit.filter(inSubtree)
    const subSplit = split.filter(inSubtree)
    resultSplits.push(subSplit.length > 0 || previousSubSplit.length > 0 ? [
      ...split.filter(node => node.branch < leftBranch),
      ...previousSubSplit,
      ...split.filter(node => node.branch > rightBranch),
    ] : split)
  }

  return resultSplits.filter(split => split.length > 0).flat()
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
