import { Comment, User } from '@/types'
import api from '@/src/client/api'
import { PopupContent } from '@/src/client/components/popupMenu'
import IconButton from '@/src/client/components/iconButton'
import commentIcon from '@/public/comment.svg'
import commentBadgeIcon from '@/public/commentBadge.svg'
import enterIcon from '@/public/enter.svg'
import enterDisabledIcon from '@/public/enterDisabled.svg'
import { KeyboardEvent, useRef, useState } from 'react'
import { useRefreshProject } from '@/src/client/projects/projectContext'
import UserAvatar from '@/src/client/users/userAvatar'
import { useLoggedInUser } from '@/src/client/users/userContext'
import { CommentCell, CommentQuote } from './commentsPane'
import useInitialState from '@/src/client/components/useInitialState'
import GlobalPopupMenu from '@/src/client/components/globalPopupMenu'

export default function CommentPopupMenu({
  comments,
  versionID,
  selection,
  runID,
  itemIndex,
  startIndex,
  users,
  labelColors,
  selectedCell = false,
}: {
  comments: Comment[]
  versionID: number
  selection?: string
  runID?: number
  itemIndex?: number
  startIndex?: number
  users: User[]
  labelColors?: Record<string, string>
  selectedCell?: boolean
}) {
  const loadPopup = (): [typeof CommentsPopup, CommentsPopupProps] => [
    CommentsPopup,
    { comments, versionID, selection, runID, itemIndex, startIndex, users, labelColors },
  ]

  return (
    <GlobalPopupMenu
      icon={comments.length > 0 ? commentBadgeIcon : commentIcon}
      loadPopup={loadPopup}
      selectedCell={selectedCell}
    />
  )
}

export type CommentsPopupProps = {
  comments: Comment[]
  versionID: number
  selection?: string
  runID?: number
  itemIndex?: number
  startIndex?: number
  users: User[]
  labelColors?: Record<string, string>
}

export function CommentsPopup({
  comments,
  versionID,
  selection,
  runID,
  itemIndex,
  startIndex,
  users,
  labelColors,
}: CommentsPopupProps) {
  const [allComments, setAllComments] = useInitialState(comments, (a, b) => JSON.stringify(a) === JSON.stringify(b))

  const haveComments = allComments.length > 0
  const sameRunComments = allComments.filter(comment => comment.runID === runID)

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
          replyTo={sameRunComments.slice(-1)[0]?.id}
          startIndex={startIndex}
          itemIndex={itemIndex}
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
  replyTo,
  itemIndex,
  startIndex,
  haveComments,
  callback,
}: {
  versionID: number
  selection?: string
  runID?: number
  replyTo?: number
  itemIndex?: number
  startIndex?: number
  haveComments: boolean
  callback?: (comment: Comment) => void
}) {
  const [newComment, setNewComment] = useState('')
  const trimmedComment = newComment.trim()
  const canAddComment = trimmedComment.length > 0

  const user = useLoggedInUser()

  const refreshProject = useRefreshProject()

  const addComment = () => {
    if (canAddComment) {
      setNewComment('')
      api.addComment(versionID, trimmedComment, replyTo, selection, runID, itemIndex, startIndex).then(comment => {
        refreshProject()
        callback?.(comment)
      })
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
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
