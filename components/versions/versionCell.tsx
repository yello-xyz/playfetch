import { ReactNode, useEffect, useState } from 'react'
import { ActivePrompt, PromptVersion, ChainVersion, IsPromptVersion, ActiveChain } from '@/types'
import VersionPopupMenu from './versionPopupMenu'
import VersionComparison from './versionComparison'
import LabelPopupMenu from '../labelPopupMenu'
import UserAvatar from '@/components/users/userAvatar'
import CommentPopupMenu from '../commentPopupMenu'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { FormatRelativeDate } from '@/src/common/formatting'
import { VersionLabels } from './versionLabels'

const extractSelection = (identifier: string) => {
  const selection = document.getSelection()
  return selection && selection?.anchorNode?.parentElement?.closest(`#${identifier}`)
    ? selection.toString().trim()
    : undefined
}

export default function VersionCell<Version extends PromptVersion | ChainVersion>({
  identifier,
  labelColors,
  version,
  index,
  isLast,
  isActiveVersion,
  compareVersion,
  activeItem,
  onSelect,
}: {
  identifier: string
  labelColors: Record<string, string>
  version: Version
  index: number
  isLast: boolean
  isActiveVersion: boolean
  compareVersion?: PromptVersion
  activeItem: ActivePrompt | ActiveChain
  onSelect: (version: Version) => void
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
    <VerticalBarWrapper
      id={identifier}
      sequenceNumber={index + 1}
      bulletStyle={isActiveVersion ? 'filled' : 'stroked'}
      strokeStyle={isLast ? 'none' : 'stroked'}>
      <div
        className={`flex-1 border rounded-lg cursor-pointer px-4 py-3 flex flex-col gap-2.5 mb-2.5 mt-1 ${
          isActiveVersion ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-200 hover:bg-gray-50'
        }`}
        onClick={() => onSelect(version)}>
        <div className='flex items-center justify-between gap-2 -mb-1'>
          <div className='flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap'>
            {user && (
              <>
                <UserAvatar user={user} size='sm' />
                <span className='overflow-hidden font-medium text-ellipsis'>{user.fullName} |</span>
              </>
            )}
            {formattedDate}
            {version.runs.length > 0 && (
              <>
                {' '}
                • {version.runs.length} {version.runs.length > 1 ? 'responses' : 'response'}
              </>
            )}
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
            <VersionPopupMenu version={version} selectedCell={isActiveVersion} />
          </div>
        </div>
        <VersionLabels version={version} colors={labelColors} />
        {IsPromptVersion(version) && (
          <div className={isActiveVersion ? '' : 'line-clamp-2'}>
            <VersionComparison version={version} compareVersion={compareVersion} />
          </div>
        )}
      </div>
    </VerticalBarWrapper>
  )
}

function VerticalBarWrapper({
  id,
  sequenceNumber = undefined,
  bulletStyle = 'stroked',
  strokeStyle = 'none',
  children,
}: {
  id?: string
  sequenceNumber?: number
  bulletStyle?: 'filled' | 'stroked'
  strokeStyle?: 'stroked' | 'dashed' | 'none'
  children: ReactNode
}) {
  const isFilled = bulletStyle === 'filled'
  const hasStroke = strokeStyle !== 'none'
  const isDashed = strokeStyle === 'dashed'
  const isSingleItem = sequenceNumber === 1 && !hasStroke

  return (
    <div id={id} className='flex items-stretch gap-4'>
      {!isSingleItem && (
        <div className='flex flex-col items-end w-10 gap-1 -ml-2'>
          {sequenceNumber !== undefined && (
            <div className='flex items-center gap-2'>
              <span className={`${isFilled ? 'text-gray-700' : 'text-gray-300'} text-xs font-medium`}>
                {sequenceNumber}
              </span>
              <div className={`rounded-full w-2.5 h-2.5 ${isFilled ? 'bg-dark-gray-700' : 'border border-gray-400'}`} />
            </div>
          )}
          {hasStroke && (
            <div className={`border-l flex-1 mb-1 pr-1 border-gray-300 ${isDashed ? 'border-dashed' : ''}`} />
          )}
        </div>
      )}
      {children}
    </div>
  )
}
