import { ActiveChain, ChainItem, ChainVersion, Prompt, QueryConfig } from '@/types'
import { ChainNode, IsChainItem } from './chainNode'
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

  const insertItem = (item: ChainItem) => {
    saveItems([...items.slice(0, itemIndex), item, ...items.slice(itemIndex)])
    setActiveIndex(index)
  }

  const insertPrompt = (promptID: number, versionID?: number) =>
    insertItem({
      promptID,
      versionID: versionID ?? promptCache.versionForItem({ promptID })?.id,
      branch: 0,
    })

  const insertNewPrompt = () => addPrompt().then(({ promptID, versionID }) => insertPrompt(promptID, versionID))

  const insertCodeBlock = () => insertItem({ code: '', branch: 0 })
  const insertQuery = defaultQueryConfig ? () => insertItem({ ...defaultQueryConfig, branch: 0 }) : undefined

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
