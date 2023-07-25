import { Comment, User } from '@/types'
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
import { CommentCell, CommentQuote } from './commentsPane'

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
  const [isMenuExpanded, setMenuExpanded] = useState(false)
  const iconRef = useRef<HTMLDivElement>(null)

  const [lastSelection, setLastSelection] = useState<string>()
  if (!isMenuExpanded && selection !== lastSelection) {
    setLastSelection(selection)
  }

  return (
    <>
      <div ref={iconRef}>
        <IconButton
          icon={comments.length > 0 ? commentBadgeIcon : commentIcon}
          onClick={() => setMenuExpanded(!isMenuExpanded)}
        />
      </div>
      <CommentsPopup
        comments={comments}
        versionID={versionID}
        selection={lastSelection}
        runID={runID}
        startIndex={startIndex}
        users={users}
        labelColors={labelColors}
        isMenuExpanded={isMenuExpanded}
        setMenuExpanded={setMenuExpanded}
        position={CalculatePopupOffset(iconRef, containerRect)}
      />
    </>
  )
}

export function CommentsPopup({
  comments,
  versionID,
  selection,
  runID,
  startIndex,
  users,
  labelColors,
  isMenuExpanded,
  setMenuExpanded,
  callback,
  position,
}: {
  comments: Comment[]
  versionID: number
  selection?: string
  runID?: number
  startIndex?: number
  users: User[]
  labelColors: Record<string, string>
  isMenuExpanded: boolean
  setMenuExpanded: (expanded: boolean) => void
  callback?: () => void
  position: { top: number; left: number } | { top: number; right: number }
}) {
  const haveComments = comments.length > 0

  return (
    <>
      <div
        className='absolute'
        style={position}
        onMouseDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}>
        <PopupMenu expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
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
              selection={selection}
              runID={runID}
              startIndex={startIndex}
              callback={callback}
              focus={!haveComments}
            />
          </div>
        </PopupMenu>
      </div>
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
    setTimeout(() => inputRef.current?.focus())
  }

  return (
    <div className='flex flex-col items-stretch gap-1'>
      {selection && !runID && <CommentQuote className='mt-2'>{selection}</CommentQuote>}
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
