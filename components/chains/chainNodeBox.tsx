import { ActiveChain, ChainItem, ChainVersion, CodeChainItem, Prompt } from '@/types'
import { ChainNode, IsPromptChainItem } from './chainNode'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import { ChainNodeBoxConnector } from './chainNodeBoxConnector'
import { useState } from 'react'
import { ChainNodeBoxHeader } from './chainNodeBoxHeader'
import { ChainNodeBoxBody } from './chainNodeBoxBody'

export function ChainNodeBox({
  chain,
  index,
  nodes,
  setNodes,
  activeIndex,
  setActiveIndex,
  savedVersion,
  isTestMode,
  setTestMode,
  prompts,
  addPrompt,
  promptCache,
}: {
  chain: ActiveChain
  index: number
  nodes: ChainNode[]
  setNodes: (nodes: ChainNode[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  savedVersion: ChainVersion | null
  isTestMode: boolean
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  addPrompt: () => Promise<{ promptID: number; versionID: number }>
  promptCache: PromptCache
}) {
  const chainNode = nodes[index]
  const isSelected = index === activeIndex
  const colorClass = isSelected ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-200'

  const [activeMenuIndex, setActiveMenuIndex] = useState<number>()

  if (nodes.length === 2 && !activeMenuIndex) {
    setActiveMenuIndex(1)
  }

  const onSelect = () => {
    setActiveIndex(index)
    setActiveMenuIndex(undefined)
  }

  const onEdit = () => {
    setTestMode(false)
    onSelect()
  }

  const updateItem = (item: ChainItem) => setNodes([...nodes.slice(0, index), item, ...nodes.slice(index + 1)])

  const renameItem = (name: string) => updateItem({ ...(chainNode as CodeChainItem), name })

  const removeItem = () => setNodes([...nodes.slice(0, index), ...nodes.slice(index + 1)])

  const insertItem = (item: ChainItem) => {
    setNodes([...nodes.slice(0, index), item, ...nodes.slice(index)])
    setActiveIndex(index)
  }

  const insertPrompt = (promptID: number, versionID?: number) =>
    insertItem({
      promptID,
      versionID: versionID ?? prompts.find(prompt => prompt.id === promptID)!.lastVersionID,
    })

  const insertNewPrompt = () => addPrompt().then(({ promptID, versionID }) => insertPrompt(promptID, versionID))

  const insertCodeBlock = () => insertItem({ code: '' })

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
          isActive={index === activeMenuIndex}
          setActive={active => setActiveMenuIndex(active ? index : undefined)}
          onInsertPrompt={insertPrompt}
          onInsertNewPrompt={insertNewPrompt}
          onInsertCodeBlock={insertCodeBlock}
        />
      )}
      <div className={`flex flex-col border w-96 rounded-lg cursor-pointer ${colorClass}`} onClick={onSelect}>
        <ChainNodeBoxPreHeader nodes={nodes} index={index} isSelected={isSelected} updateItem={updateItem} />
        <ChainNodeBoxHeader
          chainNode={chainNode}
          itemIndex={index}
          isSelected={isSelected}
          onRename={renameItem}
          onDuplicate={duplicateItem}
          onEdit={onEdit}
          onDelete={removeItem}
          savedVersion={savedVersion}
          prompts={prompts}
          users={chain.users}
        />
        <ChainNodeBoxBody chainNode={chainNode} nodes={nodes} isSelected={isSelected} promptCache={promptCache} />
      </div>
    </>
  )
}

function ChainNodeBoxPreHeader({
  nodes,
  index,
  isSelected,
  updateItem,
}: {
  nodes: ChainNode[]
  index: number
  isSelected: boolean
  updateItem: (item: ChainItem) => void
}) {
  const chainNode = nodes[index]
  const havePreviousContext = nodes.slice(0, index).some(IsPromptChainItem)
  const colorClass = isSelected ? 'border-blue-100' : 'border-gray-200 bg-white rounded-t-lg'
  const identifier = `chain-node-box-pre-header-${index}`

  return IsPromptChainItem(chainNode) && havePreviousContext ? (
    <div className={`${colorClass} border-b p-3 flex items-center justify-center gap-1.5`}>
      <input
        type='checkbox'
        className='cursor-pointer'
        id={identifier}
        checked={!!chainNode.includeContext}
        onChange={event => updateItem({ ...chainNode, includeContext: event.target.checked })}
      />
      <label className='text-xs cursor-pointer' htmlFor={identifier}>
        Include previous context
      </label>
    </div>
  ) : null
}
