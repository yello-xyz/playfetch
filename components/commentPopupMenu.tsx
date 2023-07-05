import { Comment, User, Version } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset } from './popupMenu'
import IconButton from './iconButton'
import commentIcon from '@/public/comment.svg'
import { useEffect, useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import { FormatRelativeDate } from '@/src/common/formatting'
import { VersionLabel } from './versionCell'
import { UserAvatar } from './userSidebarItem'
import { useLoggedInUser } from './userContext'

export default function CommentPopupMenu({
  version,
  users,
  labelColors,
  containerRect,
}: {
  version: Version
  users: User[]
  labelColors: Record<string, string>
  containerRect?: DOMRect
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const trimmedComment = newComment.trim()

  const user = useLoggedInUser()

  const comments = version.comments

  const refreshPrompt = useRefreshPrompt()

  const iconRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: any) => {
    if (trimmedComment.length > 0 && event.key === 'Enter') {
      setNewComment('')
      api.addComment(version.id, version.promptID, trimmedComment).then(_ => refreshPrompt())
    }
  }

  return (
    <>
      <div ref={iconRef}>
        <IconButton icon={commentIcon} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
      </div>
      {isMenuExpanded && (
        <div className='absolute' style={CalculatePopupOffset(iconRef, containerRect)}>
          <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <div className='flex flex-col gap-2 p-3 w-80'>
              {comments.map((comment, index) => (
                <CommentCell
                  comment={comment}
                  user={users.find(user => user.id === comment.userID)!}
                  labelColors={labelColors}
                  key={index}
                />
              ))}
              <div className='flex items-center gap-2'>
                <UserAvatar user={user} size='md' />
                <input
                  type='text'
                  className='flex-1 text-sm border border-gray-300 outline-none rounded-lg px-3 py-1.5'
                  placeholder='Add a comment…'
                  value={newComment}
                  onChange={event => setNewComment(event.target.value)}
                  onKeyDown={onKeyDown}
                />
              </div>
            </div>
          </PopupMenu>
        </div>
      )}
    </>
  )
}

function CommentCell({
  comment,
  user,
  labelColors,
}: {
  comment: Comment
  user: User
  labelColors: Record<string, string>
}) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatRelativeDate(comment.timestamp, 1))
  }, [comment.timestamp])

  return comment.action ? (
    <div className='flex flex-wrap items-center gap-1 p-3 text-xs bg-gray-100 rounded-lg'>
      <UserAvatar user={user} size='sm' />
      <span className='font-medium'>{user.fullName}</span>
      {comment.action === 'addLabel' ? ' added label ' : ' removed label '}
      <VersionLabel label={comment.text} colors={labelColors} />
      {' • '}
      <span className='text-gray-400'>{formattedDate}</span>
    </div>
  ) : (
    <div className='flex flex-col gap-2 text-xs'>
      <div className='flex items-center gap-1'>
        <UserAvatar user={user} size='sm' />
        <span className='font-medium'>{user.fullName}</span>
        <span className='text-gray-400'>{formattedDate}</span>
      </div>
      <div className='ml-5 text-gray-600'>{comment.text}</div>
    </div>
  )
}
