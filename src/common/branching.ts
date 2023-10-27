import { ChainItem } from '@/types'
import { IsBranchChainItem } from '@/components/chains/chainNode'

export const IsSiblingNode = (nodes: ChainItem[], index: number) => {
  if (index <= 0 || index > nodes.length - 1) {
    return false
  }
  const node = nodes[index]
  const previousNode = nodes[index - 1]
  return node.branch > previousNode.branch + (IsBranchChainItem(previousNode) ? previousNode.branches.length - 1 : 0)
}

export const SubtreeForNode = (nodes: ChainItem[], index: number, includingRoot = true) => {
  if (index < 0 || index > nodes.length - 1) {
    return []
  }
  const lowerBound = nodes[index].branch - 1
  const upperBound = IsSiblingNode(nodes, index + 1) ? nodes[index + 1].branch : Infinity
  return nodes
    .slice(index + (includingRoot ? 0 : 1))
    .filter(node => node.branch > lowerBound && node.branch < upperBound)
}

export const SubtreeForBranchOfNode = (nodes: ChainItem[], index: number, branchIndex: number) => {
  const descendants = SubtreeForNode(nodes, index, false)
  const children = takeWhile(descendants, (_, index) => index === 0 || IsSiblingNode(nodes, index))

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

export const ShiftBranchesForBranchAddedAtNode = (items: ChainItem[], index: number) => {
  const maxSubTreeBranch = Math.max(-1, ...SubtreeForNode(items, index).map(node => node.branch))
  return items.map(node => node.branch > maxSubTreeBranch ? ({ ...node, branch: node.branch + 1 }) : node)
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
