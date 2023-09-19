import { ChainVersion, Prompt, User } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, NameForCodeChainItem, OutputNode } from './chainNode'
import { EditableHeaderItem, HeaderItem } from '../tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from '../icon'
import ChainNodePopupMenu from './chainNodePopupMenu'
import CommentPopupMenu from '../commentPopupMenu'
import { useState } from 'react'

export function ChainNodeBoxHeader({
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
