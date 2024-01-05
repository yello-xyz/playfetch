import { useEffect, useState } from 'react'
import { ActivePrompt, PromptVersion, ChainVersion, ActiveChain } from '@/types'
import VersionPopupMenu from './versionPopupMenu'
import LabelPopupMenu from '../labelPopupMenu'
import UserAvatar from '@/components/users/userAvatar'
import CommentPopupMenu from '../commentPopupMenu'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { FormatRelativeDate } from '@/src/common/formatting'
import { VersionLabels } from './versionLabels'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'

const extractSelection = (identifier: string) => {
  const selection = document.getSelection()
  return selection && selection?.anchorNode?.parentElement?.closest(`#${identifier}`)
    ? selection.toString().trim()
    : undefined
}

export default function VersionCellHeader<Version extends PromptVersion | ChainVersion>({
  identifier,
  labelColors,
  version,
  isActiveVersion,
  activeItem,
  isExpanded,
  setExpanded,
}: {
  identifier: string
  labelColors: Record<string, string>
  version: Version
  isActiveVersion: boolean
  activeItem: ActivePrompt | ActiveChain
  isExpanded: boolean
  setExpanded: (expanded: boolean) => void
}) {
  const [selection, setSelection] = useState<string>()
  useEffect(() => {
    const selectionChangeHandler = () => setSelection(extractSelection(identifier))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [identifier])

  const user = activeItem.users.find(user => user.id === version.userID)
  const formattedDate = useFormattedDate(version.timestamp, FormatRelativeDate)

  return (
    <>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap'>
          <Icon
            className={`cursor-pointer -ml-3 -mr-0.5 ${isExpanded ? '' : '-rotate-90'}`}
            icon={chevronIcon}
            onClick={() => setExpanded(!isExpanded)}
          />
          {user && (
            <>
              <UserAvatar user={user} size='sm' />
              <span className='overflow-hidden font-medium text-ellipsis'>{user.fullName} |</span>
            </>
          )}
          <div className='overflow-hidden text-ellipsis'>
            {version.didRun ? formattedDate : 'Draft Version'}
            {version.runs.length > 0 && (
              <>
                {' '}
                • {version.runs.length} {version.runs.length > 1 ? 'responses' : 'response'}
              </>
            )}
          </div>
        </div>
        <div className='flex items-center gap-1'>
          <CommentPopupMenu
            comments={version.comments.filter(comment => !comment.action)}
            versionID={version.id}
            selection={selection}
            users={activeItem.users}
            selectedCell={isActiveVersion}
          />
          <LabelPopupMenu activeItem={activeItem} item={version} selectedCell={isActiveVersion} />
          <VersionPopupMenu activeItem={activeItem} version={version} selectedCell={isActiveVersion} />
        </div>
      </div>
      <VersionLabels className='ml-3.5 -mt-1' version={version} colors={labelColors} />
    </>
  )
}
