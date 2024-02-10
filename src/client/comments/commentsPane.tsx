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
import { Capitalize, FormatRelativeDate } from '@/src/common/formatting'
import { ItemLabel } from '@/src/client/labels/itemLabels'
import UserAvatar from '@/src/client/users/userAvatar'
import collapseIcon from '@/public/collapse.svg'
import IconButton from '@/src/client/components/iconButton'
import VersionComparison from '../versions/versionComparison'
import { LabelForModel } from '@/src/common/providerMetadata'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import { AvailableLabelColorsForItem } from '../labels/labelsPopup'
import { SingleTabHeader } from '@/src/client/components/tabsHeader'
import useAvailableModelProviders from '@/src/client/settings/providerContext'
import { useActiveProject } from '@/src/client/projects/projectContext'

export default function CommentsPane({
  activeItem,
  showComments,
  setShowComments,
  onSelectComment,
}: {
  activeItem?: ActivePrompt | ActiveChain
  showComments: boolean
  setShowComments: (show: boolean) => void
  onSelectComment: (parentID: number, versionID: number, runID?: number) => void
}) {
  const activeProject = useActiveProject()
  const users = activeProject.users
  const labelColors = AvailableLabelColorsForItem(activeProject)
  const versions = activeItem?.versions

  return showComments ? (
    <div className='flex flex-col h-full'>
      <SingleTabHeader label='Comments'>
        <IconButton icon={collapseIcon} onClick={() => setShowComments(false)} />
      </SingleTabHeader>
      <div className='flex flex-col gap-2 p-3 overflow-y-auto'>
        {activeProject.comments.map((comment, index) => (
          <CommentCell
            key={index}
            comment={comment}
            user={users.find(user => user.id === comment.userID)!}
            labelColors={labelColors}
            project={activeProject}
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
  const userName = user ? user.fullName : 'Unknown user'
  const isLabelOrRatingComment = comment.action !== null
  const isLabelComment = comment.action === 'addLabel' || comment.action === 'removeLabel'

  return (
    <div className={selectComment ? 'cursor-pointer' : ''} onClick={selectComment}>
      {isLabelOrRatingComment ? (
        <div className='flex flex-wrap items-center gap-1 p-3 text-xs text-gray-600 bg-gray-100 rounded-lg'>
          {user && <UserAvatar user={user} size='sm' />}
          <span className='font-medium'>{userName}</span>
          {actionPrefix(comment)}
          {isLabelComment && <ItemLabel label={comment.text} colors={labelColors} />}
          {(version || parentName) && (
            <>
              {actionInfix(comment)}
              {comment.runID ? `response${actionSuffix(comment)} in ` : ''}
              {version ? `version ${versionIndex}` : parentName}
              {!comment.runID && actionSuffix(comment)}
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
              {version && <VersionDescription index={versionIndex} version={version} />}
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

export const VersionDescription = ({ index, version }: { index: number; version: PromptVersion | ChainVersion }) => {
  const availableProviders = useAvailableModelProviders()

  return (
    <span className='text-xs font-medium text-gray-500'>
      Version {index}
      {IsPromptVersion(version) ? ` • ${LabelForModel(version.config.model, availableProviders)}` : ''}
    </span>
  )
}

const actionPrefix = (comment: Comment) => {
  switch (comment.action) {
    case 'addLabel':
      return ' added label '
    case 'removeLabel':
      return ' removed label '
    case 'thumbsUp':
    case 'thumbsDown':
      return ' rated'
  }
}

const actionInfix = (comment: Comment) => {
  switch (comment.action) {
    case 'addLabel':
      return ' to '
    case 'removeLabel':
      return ' from '
    case 'thumbsUp':
    case 'thumbsDown':
      return ' '
  }
}

const actionSuffix = (comment: Comment) => {
  const textSuffix = comment.text ? ` “${comment.text}”` : ''
  switch (comment.action) {
    case 'addLabel':
    case 'removeLabel':
      return ''
    case 'thumbsUp':
      return ` 👍${textSuffix}`
    case 'thumbsDown':
      return ` 👎${textSuffix}`
  }
}

export function CommentQuote({ children, className = '' }: { children: ReactNode; className?: string }) {
  const baseClass = 'flex flex-col gap-1 pl-2 ml-6 text-xs text-gray-600 border-l-4 border-blue-500 opacity-50'
  return <div className={`${baseClass} ${className}`}>{children}</div>
}
