import { ActivePrompt, Comment, User } from '@/types'
import { useEffect, useState } from 'react'
import { FormatRelativeDate } from '@/src/common/formatting'
import { VersionLabel } from './versionCell'
import { UserAvatar } from './userSidebarItem'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import collapseIcon from '@/public/collapse.svg'
import IconButton from './iconButton'

export default function CommentsPane({ prompt, onDismiss }: { prompt: ActivePrompt; onDismiss: () => void }) {
  const users = prompt.users
  const labelColors = AvailableLabelColorsForPrompt(prompt)
  const comments = prompt.versions
    .flatMap(version => version.comments)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className='flex flex-col px-3 pb-3 border-l border-gray-200 w-[280px]'>
      <div className='flex items-center justify-between pb-3'>
        <span className='font-medium text-gray-800'>Comments</span>
        <IconButton icon={collapseIcon} onClick={onDismiss} />
      </div>
      <div className='flex flex-col gap-2 overflow-y-auto'>
        {comments.map((comment, index) => (
          <CommentCell
            comment={comment}
            user={users.find(user => user.id === comment.userID)!}
            labelColors={labelColors}
            key={index}
          />
        ))}
      </div>
    </div>
  )
}

export function CommentCell({
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
