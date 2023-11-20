import {
  Comment,
  User,
  PromptVersion,
  ChainVersion,
  IsPromptVersion,
  ActiveProject,
  ActivePrompt,
  ActiveChain,
  CommentAction,
} from '@/types'
import { ReactNode } from 'react'
import { Capitalize, FormatRelativeDate } from '@/src/common/formatting'
import { ItemLabel } from './versions/versionLabels'
import UserAvatar from '@/components/users/userAvatar'
import collapseIcon from '@/public/collapse.svg'
import IconButton from './iconButton'
import VersionComparison from './versions/versionComparison'
import { LabelForModel } from '@/src/common/providerMetadata'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { AvailableLabelColorsForItem } from './labelPopupMenu'
import { SingleTabHeader } from './tabSelector'
import useAvailableModelProviders from '@/src/client/context/providerContext'

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
  onSelectComment: (parentID: number, versionID: number, runID?: number) => void
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
            project={project}
            versions={versions}
            onSelect={onSelectComment}
          />
        ))}
      </div>
    </div>
  ) : null
}

export function CommentCell({
  comment,
  user,
  labelColors = {},
  project,
  versions = [],
  onSelect,
}: {
  comment: Comment
  user?: User
  labelColors?: Record<string, string>
  project?: ActiveProject
  versions?: (PromptVersion | ChainVersion)[]
  onSelect?: (parentID: number, versionID: number, runID?: number) => void
}) {
  const formattedDate = useFormattedDate(comment.timestamp, timestamp => FormatRelativeDate(timestamp, 1))

  const prompt = project?.prompts?.find(parent => parent.id === comment.parentID)
  const chain = project?.chains?.find(parent => parent.id === comment.parentID)
  const parentName = prompt ? `prompt “${prompt.name}”` : chain ? `chain “${chain.name}”` : undefined

  const version = versions.find(version => version.id === comment.versionID)
  const compareVersion = versions.find(v => v.id === version?.previousID)
  const versionIndex =
    versions.filter(v => v.parentID === version?.parentID).findIndex(v => v.id === comment.versionID) + 1

  const selectComment = onSelect ? () => onSelect(comment.parentID, comment.versionID, comment.runID) : undefined
  const availableProviders = useAvailableModelProviders()
  const userName = user ? user.fullName : 'Unknown user'

  return (
    <div className={selectComment ? 'cursor-pointer' : ''} onClick={selectComment}>
      {comment.action ? (
        <div className='flex flex-wrap items-center gap-1 p-3 text-xs text-gray-600 bg-gray-100 rounded-lg'>
          {user && <UserAvatar user={user} size='sm' />}
          <span className='font-medium'>{userName}</span>
          {actionPrefix(comment.action)}
          <ItemLabel label={comment.text} colors={labelColors} />
          {(version || parentName) && (
            <>
              {actionInfix(comment.action)}
              {comment.runID ? `response${actionSuffix(comment.action)} in ` : ''}
              {version ? `version ${versionIndex}` : parentName}
              {!comment.runID && actionSuffix(comment.action)}
              {' · '}
            </>
          )}
          <span className='text-gray-400'>{formattedDate}</span>
        </div>
      ) : (
        <div className='flex flex-col gap-2 text-xs text-gray-600'>
          <div className='flex items-center gap-1'>
            {user && <UserAvatar user={user} size='sm' />}
            <span className='font-medium'>{userName}</span>
            <span className='text-gray-400'>{formattedDate}</span>
          </div>
          {(version || parentName || comment.quote) && (
            <CommentQuote>
              {version && (
                <span className='font-medium'>
                  {IsPromptVersion(version)
                    ? `${versionIndex} › ${LabelForModel(version.config.model, availableProviders)}`
                    : `Version ${versionIndex}`}
                </span>
              )}
              {!version && parentName && <span className='font-medium'>{Capitalize(parentName)}</span>}
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

const actionPrefix = (action: CommentAction) => {
  switch (action) {
    case 'addLabel':
      return ' added label '
    case 'removeLabel':
      return ' removed label '
    case 'thumbsUp':
    case 'thumbsDown':
      return ' rated'
  }
}

const actionInfix = (action: CommentAction) => {
  switch (action) {
    case 'addLabel':
      return ' to '
    case 'removeLabel':
      return ' from '
    case 'thumbsUp':
    case 'thumbsDown':
      return ' '
  }
}

const actionSuffix = (action: CommentAction) => {
  switch (action) {
    case 'addLabel':
    case 'removeLabel':
      return ''
    case 'thumbsUp':
      return ' 👍'
    case 'thumbsDown':
      return ' 👎'
  }
}

export function CommentQuote({ children, className = '' }: { children: ReactNode; className?: string }) {
  const baseClass = 'flex flex-col gap-1 pl-2 ml-6 text-xs text-gray-600 border-l-4 border-blue-500 opacity-50'
  return <div className={`${baseClass} ${className}`}>{children}</div>
}
