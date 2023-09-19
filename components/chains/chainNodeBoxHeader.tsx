import { ChainItem, ChainVersion, CodeChainItem, Prompt, User } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, NameForCodeChainItem, OutputNode } from './chainNode'
import { EditableHeaderItem, HeaderItem } from '../tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from '../icon'
import ChainNodePopupMenu from './chainNodePopupMenu'
import CommentPopupMenu from '../commentPopupMenu'
import { useState } from 'react'

export function ChainNodeBoxHeader({
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
  const icon = IsPromptChainItem(chainNode) ? promptIcon : IsCodeChainItem(chainNode) ? codeIcon : undefined

  const [label, setLabel] = useState<string>()
  const onRename = IsCodeChainItem(chainNode) ? () => setLabel(NameForCodeChainItem(chainNode)) : undefined
  const submitRename = (name: string) => {
    onUpdate({ ...(chainNode as CodeChainItem), name })
    setLabel(undefined)
  }

  return (
    <>
      <IncludeContextHeader nodes={nodes} index={index} isSelected={isSelected} onUpdate={onUpdate} />
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
              comments={savedVersion.comments.filter(comment => comment.itemIndex === index)}
              itemIndex={index}
              versionID={savedVersion.id}
              users={users}
              selectedCell={isSelected}
            />
          )}
          {(IsPromptChainItem(chainNode) || IsCodeChainItem(chainNode)) && (
            <ChainNodePopupMenu
              onRename={onRename}
              onDuplicate={onDuplicate}
              onEdit={onEdit}
              onDelete={onDelete}
              selected={isSelected}
            />
          )}
        </div>
      </div>
    </>
  )
}

function IncludeContextHeader({
  nodes,
  index,
  isSelected,
  onUpdate,
}: {
  nodes: ChainNode[]
  index: number
  isSelected: boolean
  onUpdate: (item: ChainItem) => void
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
        onChange={event => onUpdate({ ...chainNode, includeContext: event.target.checked })}
        onClick={event => event.stopPropagation()}
      />
      <label className='text-xs cursor-pointer' htmlFor={identifier}>
        Include previous context
      </label>
    </div>
  ) : null
}
