import { ActivePrompt, Comment, User, Version } from '@/types'
import { useEffect, useState } from 'react'
import { FormatRelativeDate } from '@/src/common/formatting'
import { ProviderLabel, VersionLabel } from './versionCell'
import { UserAvatar } from './userSidebarItem'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import collapseIcon from '@/public/collapse.svg'
import IconButton from './iconButton'
import VersionComparison from './versionComparison'

export default function CommentsPane({ prompt, onDismiss }: { prompt: ActivePrompt; onDismiss: () => void }) {
  const users = prompt.users
  const labelColors = AvailableLabelColorsForPrompt(prompt)
  const comments = prompt.versions
    .flatMap(version => version.comments)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div className='flex flex-col px-3 pb-3 border-l border-gray-200 w-[280px]'>
      <div className='flex items-start justify-between pb-5'>
        <span className='font-medium text-gray-800'>Comments</span>
        <IconButton icon={collapseIcon} onClick={onDismiss} />
      </div>
      <div className='flex flex-col gap-2 overflow-y-auto'>
        {comments.map((comment, index) => (
          <CommentCell
            key={index}
            comment={comment}
            user={users.find(user => user.id === comment.userID)!}
            labelColors={labelColors}
            versions={prompt.versions}
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
  versions = [],
}: {
  comment: Comment
  user: User
  labelColors: Record<string, string>
  versions?: Version[]
}) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatRelativeDate(comment.timestamp, 1))
  }, [comment.timestamp])

  const version = versions.find(version => version.id === comment.versionID)
  const compareVersion = versions.find(v => v.id === version?.previousID)
  const versionIndex = versions.findIndex(version => version.id === comment.versionID) + 1

  return comment.action ? (
    <div className='flex flex-wrap items-center gap-1 p-3 text-xs text-gray-600 bg-gray-100 rounded-lg'>
      <UserAvatar user={user} size='sm' />
      <span className='font-medium'>{user.fullName}</span>
      {comment.action === 'addLabel' ? ' added label ' : ' removed label '}
      <VersionLabel label={comment.text} colors={labelColors} />
      {version && `${comment.action === 'addLabel' ? ' to' : ' from'} version ${versionIndex}`}
      {' • '}
      <span className='text-gray-400'>{formattedDate}</span>
    </div>
  ) : (
    <div className='flex flex-col gap-2 text-xs text-gray-600'>
      <div className='flex items-center gap-1'>
        <UserAvatar user={user} size='sm' />
        <span className='font-medium'>{user.fullName}</span>
        <span className='text-gray-400'>{formattedDate}</span>
      </div>
      {version && (
        <div className='flex flex-col gap-1 pl-2 ml-6 border-l-4 border-blue-500 opacity-50'>
          <span className='font-medium'>
            {versionIndex} › {ProviderLabel(version)}
          </span>
          <div className='line-clamp-2'>
            <VersionComparison version={version} compareVersion={compareVersion} />
          </div>
        </div>
      )}
      <div className='ml-6 text-gray-600'>{comment.text}</div>
    </div>
  )
}
