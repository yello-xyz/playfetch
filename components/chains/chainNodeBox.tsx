import { ActiveChain, ChainItem, ChainVersion, CodeChainItem, Prompt, PromptChainItem } from '@/types'
import { ChainNode, InputNode, IsChainItem, IsPromptChainItem } from './chainNode'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import { LabelForModel } from '../prompts/modelSelector'
import { VersionLabels } from '../versions/versionCell'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { ChainNodeBoxConnector } from './chainNodeBoxConnector'
import { TaggedVersionPrompt } from '../versions/versionComparison'
import { ReactNode, useState } from 'react'
import { ExtractUnboundChainVariables } from './chainNodeOutput'
import { InputVariableClass } from '../prompts/promptInput'
import { ChainNodeBoxHeader } from './chainNodeBoxHeader'

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
        {IsPromptChainItem(chainNode) && (
          <PromptNodeBody item={chainNode} isSelected={isSelected} promptCache={promptCache} />
        )}
        {chainNode === InputNode && <InputNodeBody nodes={nodes} isSelected={isSelected} promptCache={promptCache} />}
      </div>
    </>
  )
}

function PromptNodeBody({
  item,
  isSelected,
  promptCache,
}: {
  item: PromptChainItem
  isSelected: boolean
  promptCache: PromptCache
}) {
  const prompt = promptCache.promptForItem(item)
  const version = promptCache.versionForItem(item)
  const index = prompt?.versions?.findIndex(v => v.id === version?.id) ?? 0
  return prompt && version ? (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-1 pb-3 pl-8 -mt-2.5 ml-0.5'>
        <span className='text-xs font-medium text-gray-500'>
          {LabelForModel(version.config.model)} | Prompt version {index + 1}
        </span>
        <VersionLabels version={version} colors={AvailableLabelColorsForItem(prompt)} hideChainReferences />
      </div>
      <ContentBody isSelected={isSelected}>
        <TaggedVersionPrompt version={version} />
      </ContentBody>
    </div>
  ) : null
}

function InputNodeBody({
  nodes,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  isSelected: boolean
  promptCache: PromptCache
}) {
  const items = nodes.filter(IsChainItem)
  const variables = ExtractUnboundChainVariables(items, promptCache)

  return variables.length > 0 ? (
    <ContentBody isSelected={isSelected}>
      <div className='flex flex-wrap gap-1'>
        {variables.map((variable, index) => (
          <span key={index} className={`${InputVariableClass}`}>{`{{${variable}}}`}</span>
        ))}
      </div>
    </ContentBody>
  ) : null
}

function ContentBody({ isSelected, children }: { isSelected: boolean; children: ReactNode }) {
  const colorClass = isSelected ? 'border-blue-100' : 'border-gray-200 bg-white rounded-b-lg'
  return <div className={`p-3 border-t ${colorClass} max-h-[150px] overflow-y-auto`}>{children}</div>
}
