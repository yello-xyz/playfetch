import { Comment, User, Version } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset } from './popupMenu'
import IconButton from './iconButton'
import commentIcon from '@/public/comment.svg'
import commentBadgeIcon from '@/public/commentBadge.svg'
import enterIcon from '@/public/enter.svg'
import enterDisabledIcon from '@/public/enterDisabled.svg'
import { useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import { UserAvatar } from './userSidebarItem'
import { useLoggedInUser } from './userContext'
import { CommentCell } from './commentsPane'

export default function CommentPopupMenu({
  comments,
  versionID,
  selection,
  runID,
  startIndex,
  users,
  labelColors,
  containerRect,
}: {
  comments: Comment[]
  versionID: number
  selection?: string
  runID?: number
  startIndex?: number
  users: User[]
  labelColors: Record<string, string>
  containerRect?: DOMRect
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const [lastSelection, setLastSelection] = useState<string>()
  if (!isMenuExpanded && selection !== lastSelection) {
    setLastSelection(selection)
  }

  const haveComments = comments.length > 0

  const iconRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div ref={iconRef}>
        <IconButton
          icon={haveComments ? commentBadgeIcon : commentIcon}
          onClick={() => setIsMenuExpanded(!isMenuExpanded)}
        />
      </div>
      {isMenuExpanded && (
        <div className='absolute' style={CalculatePopupOffset(iconRef, containerRect)}>
          <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <div className={`flex flex-col gap-2 w-80 ${haveComments ? 'p-3' : 'px-2 py-1'}`}>
              {haveComments && (
                <div className='flex flex-col gap-2 overflow-y-auto max-h-60'>
                  {comments.map((comment, index) => (
                    <CommentCell
                      comment={comment}
                      user={users.find(user => user.id === comment.userID)!}
                      labelColors={labelColors}
                      key={index}
                    />
                  ))}
                </div>
              )}
              <CommentInput
                versionID={versionID}
                selection={lastSelection}
                runID={runID}
                startIndex={startIndex}
                focus={!haveComments}
              />
            </div>
          </PopupMenu>
        </div>
      )}
    </>
  )
}

export function CommentInput({
  versionID,
  selection,
  runID,
  startIndex,
  focus,
  callback,
}: {
  versionID: number
  selection?: string
  runID?: number
  startIndex?: number
  focus?: boolean
  callback?: () => void
}) {
  const [newComment, setNewComment] = useState('')
  const trimmedComment = newComment.trim()
  const canAddComment = trimmedComment.length > 0

  const user = useLoggedInUser()

  const refreshPrompt = useRefreshPrompt()

  const addComment = () => {
    if (canAddComment) {
      setNewComment('')
      api.addComment(versionID, trimmedComment, selection, runID, startIndex).then(_ => refreshPrompt())
      callback?.()
    }
  }

  const onKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      addComment()
    }
  }

  const inputRef = useRef<HTMLInputElement>(null)
  if (focus && !inputRef.current) {
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className='flex flex-col items-stretch gap-1'>
      {selection && !runID && (
        <div className='self-start p-1 my-1 italic text-left rounded bg-blue-50 line-clamp-2'>{selection}</div>
      )}
      <div className='flex items-center gap-2'>
        <UserAvatar user={user} size='md' />
        <input
          ref={inputRef}
          type='text'
          className='flex-1 text-sm outline-none rounded-lg py-1.5 text-gray-600'
          placeholder='Add a comment…'
          value={newComment}
          onChange={event => setNewComment(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {
          <IconButton
            disabled={!canAddComment}
            icon={canAddComment ? enterIcon : enterDisabledIcon}
            onClick={addComment}
          />
        }
      </div>
    </div>
  )
}
