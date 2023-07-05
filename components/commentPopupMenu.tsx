import { User, Version } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset } from './popupMenu'
import IconButton from './iconButton'
import commentIcon from '@/public/comment.svg'
import enterIcon from '@/public/enter.svg'
import enterDisabledIcon from '@/public/enterDisabled.svg'
import { useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import { UserAvatar } from './userSidebarItem'
import { useLoggedInUser } from './userContext'
import { CommentCell } from './commentsPane'

export default function CommentPopupMenu({
  version,
  selection,
  users,
  labelColors,
  containerRect,
}: {
  version: Version
  selection?: string
  users: User[]
  labelColors: Record<string, string>
  containerRect?: DOMRect
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const trimmedComment = newComment.trim()
  const canAddComment = trimmedComment.length > 0

  const [lastSelection, setLastSelection] = useState<string>()
  if (!isMenuExpanded && selection !== lastSelection) {
    setLastSelection(selection)
  }

  const user = useLoggedInUser()

  const comments = version.comments

  const refreshPrompt = useRefreshPrompt()

  const iconRef = useRef<HTMLDivElement>(null)

  const addComment = () => {
    if (canAddComment) {
      setNewComment('')
      api.addComment(version.id, version.promptID, trimmedComment, lastSelection).then(_ => refreshPrompt())
    }
  }

  const onKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      addComment()
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
              <div className='flex items-center gap-2'>
                <UserAvatar user={user} size='md' />
                <input
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
          </PopupMenu>
        </div>
      )}
    </>
  )
}
