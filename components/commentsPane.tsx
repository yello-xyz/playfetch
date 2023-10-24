import {
  Comment,
  User,
  PromptVersion,
  ChainVersion,
  IsPromptVersion,
  ActiveProject,
  ActivePrompt,
  ActiveChain,
} from '@/types'
import { ReactNode } from 'react'
import { FormatRelativeDate } from '@/src/common/formatting'
import { ItemLabel } from './versions/versionCell'
import UserAvatar from '@/components/users/userAvatar'
import collapseIcon from '@/public/collapse.svg'
import IconButton from './iconButton'
import VersionComparison from './versions/versionComparison'
import { LabelForModel } from '@/src/common/providerMetadata'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { AvailableLabelColorsForItem } from './labelPopupMenu'
import { SingleTabHeader } from './tabSelector'
import useAvailableProviders from '@/src/client/hooks/useAvailableProviders'

export default function CommentsPane({
  project,
  activeItem,
  showComments,
  setShowComments,
  onSelectComment,
}: {
  project: ActiveProject
  activeItem?: ActivePrompt | ActiveChain
  showComments: boolean
  setShowComments: (show: boolean) => void
  onSelectComment: (version: PromptVersion | ChainVersion, runID?: number) => void
}) {
  const users = project.users
  const labelColors = AvailableLabelColorsForItem(project)
  const versions = activeItem?.versions

  return showComments ? (
    <div className='flex flex-col h-full'>
      <SingleTabHeader label='Comments'>
        <IconButton icon={collapseIcon} onClick={() => setShowComments(false)} />
      </SingleTabHeader>
      <div className='flex flex-col gap-2 p-3 overflow-y-auto'>
        {project.comments.map((comment, index) => (
          <CommentCell
            key={index}
            comment={comment}
            user={users.find(user => user.id === comment.userID)!}
            labelColors={labelColors}
            versions={versions}
            onSelect={onSelectComment}
          />
        ))}
      </div>
    </div>
  ) : null
}

export function CommentCell<Version extends PromptVersion | ChainVersion>({
  comment,
  user,
  labelColors = {},
  versions = [],
  onSelect,
}: {
  comment: Comment
  user?: User
  labelColors?: Record<string, string>
  versions?: Version[]
  onSelect?: (version: Version, runID?: number) => void
}) {
  const formattedDate = useFormattedDate(comment.timestamp, timestamp => FormatRelativeDate(timestamp, 1))

  const version = versions.find(version => version.id === comment.versionID)
  const compareVersion = versions.find(v => v.id === version?.previousID)
  const versionIndex =
    versions.filter(v => v.parentID === version?.parentID).findIndex(v => v.id === comment.versionID) + 1

  const selectVersion = onSelect && version ? () => onSelect(version, comment.runID) : undefined
  const availableProviders = useAvailableProviders()
  const userName = user ? user.fullName : 'Unknown user'

  return (
    <div className={selectVersion ? 'cursor-pointer' : ''} onClick={selectVersion}>
      {comment.action ? (
        <div className='flex flex-wrap items-center gap-1 p-3 text-xs text-gray-600 bg-gray-100 rounded-lg'>
          {user && <UserAvatar user={user} size='sm' />}
          <span className='font-medium'>{userName}</span>
          {comment.action === 'addLabel' ? ' added label ' : ' removed label '}
          <ItemLabel label={comment.text} colors={labelColors} />
          {version &&
            `${comment.action === 'addLabel' ? ' to' : ' from'} ${
              comment.runID ? 'response in ' : ''
            }version ${versionIndex} · `}
          <span className='text-gray-400'>{formattedDate}</span>
        </div>
      ) : (
        <div className='flex flex-col gap-2 text-xs text-gray-600'>
          <div className='flex items-center gap-1'>
            {user && <UserAvatar user={user} size='sm' />}
            <span className='font-medium'>{userName}</span>
            <span className='text-gray-400'>{formattedDate}</span>
          </div>
          {(version || comment.quote) && (
            <CommentQuote>
              {version && (
                <span className='font-medium'>
                  {IsPromptVersion(version)
                    ? `${versionIndex} › ${LabelForModel(version.config.model, availableProviders)}`
                    : `version ${versionIndex}`}
                </span>
              )}
              <div className='line-clamp-2'>
                {comment.quote ? (
                  <span>{comment.quote}</span>
                ) : version && IsPromptVersion(version) ? (
                  <VersionComparison version={version} compareVersion={compareVersion as PromptVersion | undefined} />
                ) : null}
              </div>
            </CommentQuote>
          )}
          <div className='ml-6 text-gray-600'>{comment.text}</div>
        </div>
      )}
    </div>
  )
}

export function CommentQuote({ children, className = '' }: { children: ReactNode; className?: string }) {
  const baseClass = 'flex flex-col gap-1 pl-2 ml-6 text-xs text-gray-600 border-l-4 border-blue-500 opacity-50'
  return <div className={`${baseClass} ${className}`}>{children}</div>
}
