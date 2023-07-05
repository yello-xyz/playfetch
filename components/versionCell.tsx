import { ReactNode } from 'react'
import { ActivePrompt, PromptConfig, User, Version } from '@/types'
import VersionPopupMenu from './versionPopupMenu'
import VersionComparison from './versionComparison'
import LabelPopupMenu from './labelPopupMenu'
import { UserAvatar } from './userSidebarItem'
import CommentPopupMenu from './commentPopupMenu'

const labelForProvider = (provider: PromptConfig['provider']) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI GPT3.5'
    case 'anthropic':
      return 'Anthropic Claude'
    case 'google':
      return 'Google PaLM'
  }
}

export default function VersionCell({
  labelColors,
  version,
  index,
  isOnly,
  isLast,
  isActiveVersion,
  compareVersion,
  prompt,
  onSelect,
  containerRect,
}: {
  labelColors: Record<string, string>
  version: Version
  index: number
  isOnly: boolean
  isLast: boolean
  isActiveVersion: boolean
  compareVersion?: Version
  prompt: ActivePrompt
  onSelect: (version: Version) => void
  containerRect?: DOMRect
}) {
  const user = prompt.users.find(user => user.id === version.userID)

  return (
    <VerticalBarWrapper
      id={version.id.toString()}
      sequenceNumber={index + 1}
      bulletStyle={isActiveVersion ? 'filled' : 'stroked'}
      strokeStyle={isLast ? 'none' : 'stroked'}>
      <div
        className={`flex-1 border border-gray-300 rounded-lg cursor-pointer p-4 flex flex-col gap-2 mb-2.5 ${
          isActiveVersion ? 'bg-sky-50' : ''
        }`}
        onClick={() => onSelect(version)}>
        <div className='flex items-center justify-between gap-2 -mb-1'>
          <div className='flex items-center flex-1 gap-2 text-xs text-gray-800'>
            <span className='font-medium'>{labelForProvider(version.config.provider)}</span>
            {version.runs.length > 0 && (
              <span>
                {' '}
                | {version.runs.length} {version.runs.length > 1 ? 'responses' : 'response'}
              </span>
            )}
          </div>
          <div className='flex items-center gap-1'>
            <CommentPopupMenu
              version={version}
              users={prompt.users}
              labelColors={labelColors}
              containerRect={containerRect}
            />
            {prompt.availableLabels.length > 0 && (
              <LabelPopupMenu containerRect={containerRect} prompt={prompt} version={version} />
            )}
            {!isOnly && <VersionPopupMenu containerRect={containerRect} version={version} />}
          </div>
        </div>
        {user && prompt.projectID !== user.id && <UserDetails user={user} />}
        {version.labels.length > 0 && (
          <div className='flex gap-1'>
            {version.labels.map((label, labelIndex) => (
              <VersionLabel label={label} colors={labelColors} key={labelIndex} />
            ))}
          </div>
        )}
        <div className={isActiveVersion ? '' : 'line-clamp-2'}>
          <VersionComparison version={version} compareVersion={compareVersion} />
        </div>
      </div>
    </VerticalBarWrapper>
  )
}

export function VersionLabel({ label, colors }: { label: string; colors: Record<string, string> }) {
  return <span className={`px-1.5 py-px text-xs text-white rounded ${colors[label]}`}>{label}</span>
}

function UserDetails({ user }: { user: User }) {
  return (
    <div className='flex items-center gap-1 text-xs'>
      <UserAvatar user={user} size='sm' />
      <span className='font-normal'>{user.fullName}</span>
    </div>
  )
}

export function VerticalBarWrapper({
  id,
  sequenceNumber = undefined,
  bulletStyle = 'stroked',
  strokeStyle = 'none',
  children,
}: {
  id?: string
  sequenceNumber?: number
  bulletStyle?: 'filled' | 'stroked'
  strokeStyle?: 'stroked' | 'dashed' | 'none'
  children: ReactNode
}) {
  const isFilled = bulletStyle === 'filled'
  const hasStroke = strokeStyle !== 'none'
  const isDashed = strokeStyle === 'dashed'

  return (
    <div id={id} className='flex items-stretch gap-4'>
      <div className='flex flex-col items-end w-10 gap-1'>
        {sequenceNumber !== undefined && (
          <div className='flex items-center gap-2'>
            <span className={`${isFilled ? 'text-cyan-950' : 'text-gray-400'} text-xs`}>{sequenceNumber}</span>
            <div className={`rounded-full w-2.5 h-2.5 ${isFilled ? 'bg-cyan-950' : 'border border-gray-400'}`} />
          </div>
        )}
        {hasStroke && (
          <div className={`border-l flex-1 mb-1 pr-1 border-gray-400 ${isDashed ? 'border-dashed' : ''}`} />
        )}
      </div>
      {children}
    </div>
  )
}
