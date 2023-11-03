import { ActiveChain, BranchChainItem, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode, InputNode, IsBranchChainItem, IsChainItem, OutputNode } from './chainNode'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import ChainNodeBoxHeader from './chainNodeBoxHeader'
import ChainNodeBoxBody from './chainNodeBoxBody'
import ChainNodeBoxFooter from './chainNodeBoxFooter'
import { PruneBranchAndShiftLeft, PruneNodeAndShiftUp } from '@/src/common/branching'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { DownStroke } from './chainNodeBoxConnector'

export function ChainNodeBox({
  chain,
  index,
  nodes,
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
  index: number
  nodes: ChainNode[]
  insertItem: (item: ChainItem) => void
  saveItems: (items: ChainItem[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  savedVersion: ChainVersion | null
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  promptCache: ChainPromptCache
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

  const setDialogPrompt = useModalDialogPrompt()

  const removeItem = () => {
    let updatedItems = items
    if (IsBranchChainItem(chainNode)) {
      for (let branchIndex = chainNode.branches.length - 1; branchIndex > 0; branchIndex--) {
        updatedItems = PruneBranchAndShiftLeft(updatedItems, itemIndex, branchIndex)
      }
    }
    updatedItems = PruneNodeAndShiftUp(updatedItems, itemIndex)
    const prunedNodeCount = items.length - updatedItems.length - 1
    if (prunedNodeCount > 0) {
      const nodeDescription = `${prunedNodeCount} node${prunedNodeCount > 1 ? 's' : ''}`
      const prunedBranchCount = (chainNode as BranchChainItem).branches.length - 1
      const branchDescription = `${prunedBranchCount} branch${prunedBranchCount > 1 ? 'es' : ''}`
      setDialogPrompt({
        title: `This will prune ${branchDescription} with ${nodeDescription} from the chain.`,
        confirmTitle: 'Proceed',
        callback: () => saveItems(updatedItems),
        destructive: true,
      })
    } else {
      saveItems(updatedItems)
    }
  }

  const duplicateItem = () => {
    insertItem({ ...(chainNode as ChainItem), output: undefined })
    setActiveIndex(index + 1)
  }

  const dropShadow = 'drop-shadow-[0_8px_8px_rgba(0,0,0,0.02)]'

  return (
    <div className='flex flex-col items-center h-full'>
      <div
        className={`relative flex flex-col border w-96 rounded-lg cursor-pointer ${dropShadow} ${colorClass} self-start`}
        onClick={() => setActiveIndex(index)}>
        {chainNode !== InputNode && <SmallDot position='top' />}
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
          onUpdate={updateItem}
          isSelected={isSelected}
          promptCache={promptCache}
        />
        {chainNode !== OutputNode && <SmallDot position='bottom' />}
      </div>
      <DownStroke height='-mb-[6px]' spacer grow />
    </div>
  )
}

export const SmallDot = ({
  position,
  color = 'bg-white border border-gray-400',
}: {
  position: 'top' | 'bottom'
  color?: string
}) => <div className={`${layoutForPosition(position)} ${color} absolute self-center z-10 w-2.5 h-2.5 rounded-full`} />

const layoutForPosition = (position: 'top' | 'bottom') => (position === 'top' ? 'top-0 -mt-1.5' : 'bottom-0 -mb-1.5')
