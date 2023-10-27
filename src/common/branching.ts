import { ChainItem } from '@/types'
import { IsBranchChainItem } from '@/components/chains/chainNode'

export const IsSiblingNode = (items: ChainItem[], index: number) => {
  if (index <= 0 || index > items.length - 1) {
    return false
  }
  const node = items[index]
  const previousNode = items[index - 1]
  return node.branch > previousNode.branch + (IsBranchChainItem(previousNode) ? previousNode.branches.length - 1 : 0)
}
