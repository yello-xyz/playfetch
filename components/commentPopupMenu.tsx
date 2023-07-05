import { Comment, User, Version } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset } from './popupMenu'
import IconButton from './iconButton'
import addIcon from '@/public/add.svg'
import commentIcon from '@/public/comment.svg'
import { useEffect, useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import Icon from './icon'
import { FormatRelativeDate } from '@/src/common/formatting'
import { VersionLabel } from './versionCell'
import { UserAvatar } from './userSidebarItem'

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

  const comments = version.comments

  const refreshPrompt = useRefreshPrompt()

  const iconRef = useRef<HTMLDivElement>(null)

  const addComment = (text: string) => {
    setIsMenuExpanded(false)
    setNewComment('')
    // api.addComment(version.promptID, version.id, text).then(_ => refreshPrompt())
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
              <input
                type='text'
                className='w-full text-sm border border-gray-300 outline-none rounded-lg px-3 py-1.5'
                placeholder='Add a comment…'
                value={newComment}
                onChange={event => setNewComment(event.target.value)}
              />
              {newComment.trim().length > 0 && (
                <div className='flex items-center gap-1 p-1' onClick={() => addComment(newComment.trim())}>
                  <Icon icon={addIcon} />
                  Add comment
                </div>
              )}
            </div>
          </PopupMenu>
        </div>
      )}
    </>
  )
}

function CommentCell({ comment, user, labelColors }: { comment: Comment; user: User; labelColors: Record<string, string> }) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatRelativeDate(comment.timestamp, 1))
  }, [comment.timestamp])

  return comment.action ? (
    <div className='flex flex-wrap items-center gap-1 p-3 bg-gray-100 rounded-lg'>
      <UserAvatar user={user} size='sm' />
      <span className='font-medium'>{user.fullName}</span>
      {comment.action === 'addLabel' ? ' added label ' : ' removed label '}
      <VersionLabel label={comment.text} colors={labelColors} />{' • '}
      <span className='text-gray-400'>{formattedDate}</span>
    </div>
  ) : (
    <div className='flex items-center gap-1 px-2 py-1 text-xs'>
      {comment.text}
      <span className='text-gray-400'>{formattedDate}</span>
    </div>
  )
}
