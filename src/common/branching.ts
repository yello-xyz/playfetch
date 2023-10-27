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
