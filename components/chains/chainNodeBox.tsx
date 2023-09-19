import { ActiveChain, ChainItem, ChainVersion, CodeChainItem, Prompt, PromptChainItem, User } from '@/types'
import {
  ChainNode,
  InputNode,
  IsChainItem,
  IsCodeChainItem,
  IsPromptChainItem,
  NameForCodeChainItem,
  OutputNode,
} from './chainNode'
import { EditableHeaderItem, HeaderItem } from '../tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from '../icon'
import ChainNodePopupMenu from './chainNodePopupMenu'
import CommentPopupMenu from '../commentPopupMenu'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import { LabelForModel } from '../prompts/modelSelector'
import { VersionLabels } from '../versions/versionCell'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { ChainNodeBoxConnector } from './chainNodeBoxConnector'
import { TaggedVersionPrompt } from '../versions/versionComparison'
import { ReactNode, useState } from 'react'
import { ExtractUnboundChainVariables } from './chainNodeOutput'
import { InputVariableClass } from '../prompts/promptInput'

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
        <ChainNodeHeader
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
          <PromptVersionContent item={chainNode} isSelected={isSelected} promptCache={promptCache} />
        )}
        {chainNode === InputNode && <InputContent nodes={nodes} isSelected={isSelected} promptCache={promptCache} />}
      </div>
    </>
  )
}

function ChainNodeHeader({
  chainNode,
  itemIndex,
  isSelected,
  onRename,
  onDuplicate,
  onEdit,
  onDelete,
  savedVersion,
  prompts,
  users,
}: {
  chainNode: ChainNode
  itemIndex: number
  isSelected: boolean
  onRename: (name: string) => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
  savedVersion: ChainVersion | null
  prompts: Prompt[]
  users: User[]
}) {
  const icon = IsPromptChainItem(chainNode) ? promptIcon : IsCodeChainItem(chainNode) ? codeIcon : undefined

  const [label, setLabel] = useState<string>()
  const onRenameCodeChainItem = IsCodeChainItem(chainNode) ? () => setLabel(NameForCodeChainItem(chainNode)) : undefined
  const submitRename = (name: string) => {
    onRename(name)
    setLabel(undefined)
  }

  return (
    <div className={`flex items-center justify-between px-2 rounded-t-lg`}>
      {label !== undefined ? (
        <EditableHeaderItem value={label} onChange={setLabel} onSubmit={() => submitRename(label)} />
      ) : (
        <HeaderItem>
          {icon && <Icon className='mr-0.5 -ml-2' icon={icon} />}
          {chainNode === InputNode && 'Inputs'}
          {chainNode === OutputNode && 'Output'}
          {IsPromptChainItem(chainNode) && prompts.find(prompt => prompt.id === chainNode.promptID)?.name}
          {IsCodeChainItem(chainNode) && NameForCodeChainItem(chainNode)}
        </HeaderItem>
      )}
      <div className='flex items-center gap-1'>
        {savedVersion && (
          <CommentPopupMenu
            comments={savedVersion.comments.filter(comment => comment.itemIndex === itemIndex)}
            itemIndex={itemIndex}
            versionID={savedVersion.id}
            users={users}
            selectedCell={isSelected}
          />
        )}
        {(IsPromptChainItem(chainNode) || IsCodeChainItem(chainNode)) && (
          <ChainNodePopupMenu
            onRename={onRenameCodeChainItem}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onDelete={onDelete}
            selected={isSelected}
          />
        )}
      </div>
    </div>
  )
}

function PromptVersionContent({
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

function InputContent({
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
