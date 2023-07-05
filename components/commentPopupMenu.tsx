import { Version } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset } from './popupMenu'
import IconButton from './iconButton'
import addIcon from '@/public/add.svg'
import commentIcon from '@/public/comment.svg'
import { useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import Icon from './icon'
import { FormatRelativeDate } from '@/src/common/formatting'

export default function CommentPopupMenu({ version, containerRect }: { version: Version; containerRect?: DOMRect }) {
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
            <div className='p-3 w-80'>
              {comments.map((comment, index) => (
                <div className='flex items-center gap-1 px-2 py-1' key={index}>
                  {comment.text}
                </div>
              ))}
              <input
                type='text'
                className='w-full text-sm mb-3 border border-gray-300 outline-none rounded-lg px-3 py-1.5'
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
