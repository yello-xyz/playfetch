import { LoopCompletionIndexForNode, ShouldBranchLoopOnCompletion, SubtreeForNode } from '@/src/common/branching'
import { BranchChainItem, ChainItem, CodeChainItem, PromptChainItem, QueryChainItem } from '@/types'

export const InputNode = 'input'
export const OutputNode = 'output'
export type ChainNode = ChainItem | typeof InputNode | typeof OutputNode

export const IsChainItem = (item: ChainNode): item is ChainItem => item !== InputNode && item !== OutputNode
export const IsPromptChainItem = (item: ChainNode): item is PromptChainItem => IsChainItem(item) && 'promptID' in item
export const IsBranchChainItem = (item: ChainNode): item is BranchChainItem => IsChainItem(item) && 'branches' in item
export const IsCodeChainItem = (item: ChainNode): item is CodeChainItem =>
  IsChainItem(item) && !IsBranchChainItem(item) && 'code' in item
export const IsQueryChainItem = (item: ChainNode): item is QueryChainItem => IsChainItem(item) && 'query' in item
export const NameForCodeChainItem = (item: CodeChainItem) => item.name || 'Code block'

export const SubtreeForChainNode = (
  chainNode: ChainNode,
  nodes: ChainNode[],
  includeRoot = true,
  considerLoops = false
): ChainItem[] => {
  const items = nodes.filter(IsChainItem)
  if (chainNode === InputNode) {
    return items
  } else if (chainNode === OutputNode) {
    return []
  } else {
    if (considerLoops) {
      const loopIndex = LoopCompletionIndexForNode(
        items,
        items.findLastIndex(node => node.branch === chainNode.branch),
        chainNode.branch
      )
      if (loopIndex >= 0) {
        return SubtreeForChainNode(items[loopIndex], nodes, true, false)
      }
    }
    return SubtreeForNode(items, items.indexOf(chainNode), includeRoot)
  }
}

export const CanChainNodeIncludeContext = (chainNode: ChainNode, nodes: ChainNode[]): chainNode is PromptChainItem =>
  IsPromptChainItem(chainNode) &&
  nodes.some(
    node =>
      IsPromptChainItem(node) &&
      (SubtreeForChainNode(node, nodes, false).includes(chainNode) ||
        (ShouldBranchLoopOnCompletion(nodes.filter(IsChainItem), node.branch) &&
          SubtreeForChainNode(node, nodes, false, true).includes(chainNode)))
  )
