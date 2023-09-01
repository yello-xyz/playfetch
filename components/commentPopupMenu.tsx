import { Comment, User } from '@/types'
import api from '@/src/client/api'
import { PopupContent } from './popupMenu'
import IconButton from './iconButton'
import commentIcon from '@/public/comment.svg'
import commentBadgeIcon from '@/public/commentBadge.svg'
import enterIcon from '@/public/enter.svg'
import enterDisabledIcon from '@/public/enterDisabled.svg'
import { useRef, useState } from 'react'
import { useRefreshActiveItem } from '@/src/client/context/refreshContext'
import { UserAvatar } from './userSidebarItem'
import { useLoggedInUser } from '@/src/client/context/userContext'
import { CommentCell, CommentQuote } from './commentsPane'
import useInitialState from '@/src/client/hooks/useInitialState'
import useGlobalPopup from '@/src/client/context/globalPopupContext'

export default function CommentPopupMenu({
  comments,
  versionID,
  selection,
  runID,
  startIndex,
  users,
  labelColors,
}: {
  comments: Comment[]
  versionID: number
  selection?: string
  runID?: number
  startIndex?: number
  users: User[]
  labelColors: Record<string, string>
}) {
  const iconRef = useRef<HTMLDivElement>(null)

  const [setPopup, setPopupProps, setPopupLocation] = useGlobalPopup<CommentsPopupProps>()

  const togglePopup = () => {
    const iconRect = iconRef.current?.getBoundingClientRect()
    setPopup(CommentsPopup)
    setPopupProps({
      comments,
      versionID,
      selection,
      runID,
      startIndex,
      users,
      labelColors,
    })
    setPopupLocation({ right: iconRect?.right, top: iconRect?.bottom })
  }

  return (
    <div ref={iconRef}>
      <IconButton icon={comments.length > 0 ? commentBadgeIcon : commentIcon} onClick={togglePopup} />
    </div>
  )
}

export type CommentsPopupProps = {
  comments: Comment[]
  versionID: number
  selection?: string
  runID?: number
  startIndex?: number
  users: User[]
  labelColors: Record<string, string>
}

export function CommentsPopup({
  comments,
  versionID,
  selection,
  runID,
  startIndex,
  users,
  labelColors,
}: CommentsPopupProps) {
  const haveComments = comments.length > 0

  const [allComments, setAllComments] = useInitialState(comments, (a, b) => JSON.stringify(a) === JSON.stringify(b))

  return (
    <PopupContent>
      <div className={`flex flex-col gap-2 w-80 ${haveComments ? 'p-3' : 'px-2 py-1'}`}>
        {haveComments && (
          <div className='flex flex-col gap-2 overflow-y-auto max-h-60'>
            {allComments.map((comment, index) => (
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
          callback={comment => setAllComments([...allComments, comment])}
          haveComments={haveComments}
        />
      </div>
    </PopupContent>
  )
}

function CommentInput({
  versionID,
  selection,
  runID,
  startIndex,
  haveComments,
  callback,
}: {
  versionID: number
  selection?: string
  runID?: number
  startIndex?: number
  haveComments: boolean
  callback?: (comment: Comment) => void
}) {
  const [newComment, setNewComment] = useState('')
  const trimmedComment = newComment.trim()
  const canAddComment = trimmedComment.length > 0

  const user = useLoggedInUser()

  const refreshActiveItem = useRefreshActiveItem()

  const addComment = () => {
    if (canAddComment) {
      setNewComment('')
      api.addComment(versionID, trimmedComment, selection, runID, startIndex).then(comment => {
        refreshActiveItem()
        callback?.(comment)
      })
    }
  }

  const onKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      addComment()
    }
  }

  const inputRef = useRef<HTMLInputElement>(null)
  if (!haveComments && !inputRef.current) {
    setTimeout(() => inputRef.current?.focus())
  }

  return (
    <div className='flex flex-col items-stretch gap-1'>
      {selection && (!runID || !haveComments) && <CommentQuote className='mt-2'>{selection}</CommentQuote>}
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
