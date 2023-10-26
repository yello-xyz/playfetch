import {
  ActiveChain,
  BranchChainItem,
  ChainItem,
  ChainVersion,
  CodeChainItem,
  Prompt,
  PromptChainItem,
  QueryChainItem,
  QueryConfig,
} from '@/types'
import { ChainNode, IsBranchChainItem, IsChainItem } from './chainNode'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import ChainNodeBoxConnector from './chainNodeBoxConnector'
import ChainNodeBoxHeader from './chainNodeBoxHeader'
import ChainNodeBoxBody from './chainNodeBoxBody'
import ChainNodeBoxFooter from './chainNodeBoxFooter'

export function ChainNodeBox({
  chain,
  index,
  nodes,
  saveItems,
  activeIndex,
  setActiveIndex,
  isMenuActive,
  setMenuActive,
  savedVersion,
  isTestMode,
  setTestMode,
  prompts,
  addPrompt,
  promptCache,
  defaultQueryConfig,
}: {
  chain: ActiveChain
  index: number
  nodes: ChainNode[]
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  isMenuActive: boolean
  setMenuActive: (active: boolean) => void
  savedVersion: ChainVersion | null
  isTestMode: boolean
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  addPrompt: () => Promise<{ promptID: number; versionID: number }>
  promptCache: ChainPromptCache
  defaultQueryConfig?: Omit<QueryConfig, 'branch'>
}) {
  const chainNode = nodes[index]
  const isSelected = index === activeIndex
  const colorClass = isSelected ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-200'

  const onEdit = () => {
    setTestMode(false)
    setActiveIndex(index)
  }

  const items = nodes.filter(IsChainItem)
  const itemIndex = index - 1

  const updateItem = (item: ChainItem) => saveItems([...items.slice(0, itemIndex), item, ...items.slice(itemIndex + 1)])

  const removeItem = () => saveItems([...items.slice(0, itemIndex), ...items.slice(itemIndex + 1)])

  const insertItem = (
    item:
      | Omit<CodeChainItem, 'branch'>
      | Omit<BranchChainItem, 'branch'>
      | Omit<QueryChainItem, 'branch'>
      | Omit<PromptChainItem, 'branch'>
  ) => {
    const itemWithBranch = { ...item, branch: items[itemIndex]?.branch ?? 0 }
    const shiftedItems = shiftBranchesForItemInsertion(items, itemIndex, itemWithBranch)
    saveItems([...shiftedItems.slice(0, itemIndex), itemWithBranch, ...shiftedItems.slice(itemIndex)])
    setActiveIndex(index)
  }

  const insertPrompt = (promptID: number, versionID?: number) =>
    insertItem({
      promptID,
      versionID: versionID ?? promptCache.versionForItem({ promptID })?.id,
    })

  const insertNewPrompt = () => addPrompt().then(({ promptID, versionID }) => insertPrompt(promptID, versionID))

  const insertCodeBlock = () => insertItem({ code: '' })
  const insertQuery = defaultQueryConfig ? () => insertItem({ ...defaultQueryConfig }) : undefined

  const duplicateItem = () => {
    insertItem({ ...(chainNode as ChainItem), output: undefined })
    setActiveIndex(index + 1)
  }

  return (
    <>
      {index > 0 && (
        <ChainNodeBoxConnector
          prompts={prompts}
          isDisabled={isTestMode}
          isActive={isMenuActive}
          setActive={setMenuActive}
          canDismiss={nodes.length > 2}
          onInsertPrompt={insertPrompt}
          onInsertNewPrompt={insertNewPrompt}
          onInsertCodeBlock={insertCodeBlock}
          onInsertQuery={insertQuery}
        />
      )}
      <div
        className={`flex flex-col border w-96 rounded-lg cursor-pointer drop-shadow-[0_8px_8px_rgba(0,0,0,0.02)] ${colorClass}`}
        onClick={() => setActiveIndex(index)}>
        <ChainNodeBoxHeader
          nodes={nodes}
          index={index}
          isSelected={isSelected}
          onUpdate={updateItem}
          onDuplicate={duplicateItem}
          onEdit={onEdit}
          onDelete={removeItem}
          savedVersion={savedVersion}
          prompts={prompts}
          users={chain.users}
        />
        <ChainNodeBoxBody chainNode={chainNode} items={items} isSelected={isSelected} promptCache={promptCache} />
        <ChainNodeBoxFooter
          nodes={nodes}
          index={index}
          saveItems={saveItems}
          isSelected={isSelected}
          promptCache={promptCache}
        />
      </div>
    </>
  )
}

const shiftBranchesForItemInsertion = (items: ChainItem[], index: number, newItem: ChainItem) => {
  if (IsBranchChainItem(newItem)) {
    const currentNode: ChainItem | undefined = items[index]
    const currentNodeIsBranch = currentNode && IsBranchChainItem(currentNode)
    const nextNode: ChainItem | undefined = items[index + 1]
    const nextNodeIsSibling =
      nextNode && nextNode.branch > newItem.branch + (currentNodeIsBranch ? currentNode.branches.length - 1 : 0)
    const siblingNode = nextNodeIsSibling ? nextNode : undefined
    const nextNodes = items.slice(index)
    const maxSubTreeBranch = Math.max(
      newItem.branch,
      ...nextNodes.filter(node => !siblingNode || node.branch < siblingNode.branch).map(node => node.branch)
    )
    return items.map(item => ({
      ...item,
      branch: item.branch > maxSubTreeBranch ? item.branch + newItem.branches.length - 1 : item.branch,
    }))
  } else {
    return items
  }
}
