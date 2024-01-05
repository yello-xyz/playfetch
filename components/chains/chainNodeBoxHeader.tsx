import { ChainItem, ChainVersion, CodeChainItem, Prompt, PromptChainItem, User } from '@/types'
import {
  CanChainNodeIncludeContext,
  ChainNode,
  InputNode,
  IsBranchChainItem,
  IsChainItem,
  IsCodeChainItem,
  IsPromptChainItem,
  IsQueryChainItem,
  NameForCodeChainItem,
  OutputNode,
  SubtreeForChainNode,
} from './chainNode'
import { EditableHeaderItem, HeaderItem } from '../tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import queryIcon from '@/public/query.svg'
import branchIcon from '@/public/branch.svg'
import Icon from '../icon'
import ChainNodePopupMenu from './chainNodePopupMenu'
import CommentPopupMenu from '../commentPopupMenu'
import { ReactNode, useState } from 'react'
import { ShouldBranchLoopOnCompletion } from '@/src/common/branching'

export default function ChainNodeBoxHeader({
  nodes,
  index,
  isSelected,
  onUpdate,
  onDuplicate,
  onEdit,
  onDelete,
  savedVersion,
  prompts,
  users,
}: {
  nodes: ChainNode[]
  index: number
  isSelected: boolean
  onUpdate: (item: ChainItem) => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
  savedVersion: ChainVersion | null
  prompts: Prompt[]
  users: User[]
}) {
  const chainNode = nodes[index]
  const icon = IsPromptChainItem(chainNode)
    ? promptIcon
    : IsQueryChainItem(chainNode)
    ? queryIcon
    : IsCodeChainItem(chainNode)
    ? codeIcon
    : IsBranchChainItem(chainNode)
    ? branchIcon
    : undefined

  const onRename = IsCodeChainItem(chainNode) ? () => setLabel(NameForCodeChainItem(chainNode)) : undefined
  const [label, setLabel] = useState<string>()
  const submitRename = (name: string) => {
    onUpdate({ ...(chainNode as CodeChainItem), name })
    setLabel(undefined)
  }

  const canIncludeContext = CanChainNodeIncludeContext(chainNode, nodes)

  return (
    <>
      {canIncludeContext && (
        <IncludeContextHeader chainNode={chainNode} index={index} isSelected={isSelected} onUpdate={onUpdate}>
          <PopupMenuIcons
            chainNode={chainNode}
            index={index}
            isSelected={isSelected}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onDelete={onDelete}
            savedVersion={savedVersion}
            users={users}
          />
        </IncludeContextHeader>
      )}
      <div className={`flex items-center px-2 rounded-t-lg`}>
        {label !== undefined ? (
          <EditableHeaderItem
            value={label}
            onChange={setLabel}
            onSubmit={() => submitRename(label)}
            onCancel={() => setLabel(undefined)}
          />
        ) : (
          <HeaderItem className='flex-1 min-w-0'>
            {icon && <Icon className='mr-0.5 -ml-2' icon={icon} />}
            <span className='overflow-hidden text-ellipsis'>
              {chainNode === InputNode && 'Inputs'}
              {chainNode === OutputNode && 'Output'}
              {IsPromptChainItem(chainNode) && prompts.find(prompt => prompt.id === chainNode.promptID)?.name}
              {IsCodeChainItem(chainNode) && NameForCodeChainItem(chainNode)}
              {IsBranchChainItem(chainNode) && 'Branch'}
              {IsQueryChainItem(chainNode) && 'Query'}
            </span>
          </HeaderItem>
        )}
        {!canIncludeContext && (
          <PopupMenuIcons
            chainNode={chainNode}
            index={index}
            isSelected={isSelected}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onDelete={onDelete}
            savedVersion={savedVersion}
            users={users}
          />
        )}
      </div>
    </>
  )
}

function PopupMenuIcons({
  chainNode,
  index,
  isSelected,
  onRename,
  onDuplicate,
  onEdit,
  onDelete,
  savedVersion,
  users,
}: {
  chainNode: ChainNode
  index: number
  isSelected: boolean
  onRename?: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
  savedVersion: ChainVersion | null
  users: User[]
}) {
  return (
    <div className='flex items-center gap-1'>
      {savedVersion && (
        <CommentPopupMenu
          comments={savedVersion.comments.filter(comment => comment.itemIndex === index)}
          itemIndex={index}
          versionID={savedVersion.id}
          users={users}
          selectedCell={isSelected}
        />
      )}
      {(IsPromptChainItem(chainNode) ||
        IsCodeChainItem(chainNode) ||
        IsBranchChainItem(chainNode) ||
        IsQueryChainItem(chainNode)) && (
        <ChainNodePopupMenu
          onRename={onRename}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onDelete={onDelete}
          selected={isSelected}
        />
      )}
    </div>
  )
}

function IncludeContextHeader({
  chainNode,
  index,
  isSelected,
  onUpdate,
  children,
}: {
  chainNode: PromptChainItem
  index: number
  isSelected: boolean
  onUpdate: (item: ChainItem) => void
  children: ReactNode
}) {
  const colorClass = isSelected ? 'border-blue-100' : 'border-gray-200 bg-white rounded-t-lg'
  const identifier = `chain-node-box-pre-header-${index}`

  return (
    <div className={`${colorClass} border-b px-3 py-2.5 flex items-center justify-between gap-1.5`}>
      <div className='flex items-center gap-1.5'>
        <input
          type='checkbox'
          className='cursor-pointer'
          id={identifier}
          checked={!!chainNode.includeContext}
          onChange={event => onUpdate({ ...chainNode, includeContext: event.target.checked })}
          onClick={event => event.stopPropagation()}
        />
        <label className='text-xs cursor-pointer' htmlFor={identifier} onClick={event => event.stopPropagation()}>
          Include previous prompt context
        </label>
      </div>
      {children}
    </div>
  )
}
