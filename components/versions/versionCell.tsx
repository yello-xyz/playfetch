import { ReactNode, useEffect, useState } from 'react'
import { ActivePrompt, User, PromptVersion, ChainVersion, IsPromptVersion, ActiveChain } from '@/types'
import VersionPopupMenu from './versionPopupMenu'
import VersionComparison from './versionComparison'
import LabelPopupMenu from '../labelPopupMenu'
import UserAvatar from '@/components/users/userAvatar'
import CommentPopupMenu from '../commentPopupMenu'
import chainIcon from '@/public/chainSmall.svg'
import endpointIcon from '@/public/endpointSmall.svg'
import Icon from '../icon'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import useAvailableProviders from '@/src/client/hooks/useAvailableProviders'
import { FormatRelativeDate } from '@/src/common/formatting'

const extractSelection = (identifier: string) => {
  const selection = document.getSelection()
  return selection && selection?.anchorNode?.parentElement?.closest(`#${identifier}`)
    ? selection.toString().trim()
    : undefined
}

export default function VersionCell<Version extends PromptVersion | ChainVersion>({
  identifier,
  labelColors,
  version,
  index,
  isLast,
  isActiveVersion,
  compareVersion,
  activeItem,
  onSelect,
}: {
  identifier: string
  labelColors: Record<string, string>
  version: Version
  index: number
  isLast: boolean
  isActiveVersion: boolean
  compareVersion?: PromptVersion
  activeItem: ActivePrompt | ActiveChain
  onSelect: (version: Version) => void
}) {
  const [selection, setSelection] = useState<string>()
  useEffect(() => {
    const selectionChangeHandler = () => setSelection(extractSelection(identifier))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [identifier])

  const user = activeItem.users.find(user => user.id === version.userID)
  const formattedDate = useFormattedDate(version.timestamp, FormatRelativeDate)

  return (
    <VerticalBarWrapper
      id={identifier}
      sequenceNumber={index + 1}
      bulletStyle={isActiveVersion ? 'filled' : 'stroked'}
      strokeStyle={isLast ? 'none' : 'stroked'}>
      <div
        className={`flex-1 border rounded-lg cursor-pointer px-4 py-3 flex flex-col gap-2 mb-2.5 mt-1 ${
          isActiveVersion ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-200 hover:bg-gray-50'
        }`}
        onClick={() => onSelect(version)}>
        <div className='flex items-center justify-between gap-2 -mb-1'>
          <div className='flex items-center flex-1 gap-2 text-xs text-gray-700'>
            {formattedDate}
            {version.runs.length > 0 && (
              <>
                {' '}
                • {version.runs.length} {version.runs.length > 1 ? 'responses' : 'response'}
              </>
            )}
          </div>
          <div className='flex items-center gap-1'>
            <CommentPopupMenu
              comments={version.comments.filter(comment => !comment.action)}
              versionID={version.id}
              selection={selection}
              users={activeItem.users}
              selectedCell={isActiveVersion}
            />
            <LabelPopupMenu activeItem={activeItem} item={version} selectedCell={isActiveVersion} />
            <VersionPopupMenu version={version} selectedCell={isActiveVersion} />
          </div>
        </div>
        {user && activeItem.projectID !== user.id && <UserDetails user={user} />}
        <VersionLabels version={version} colors={labelColors} />
        {IsPromptVersion(version) && (
          <div className={isActiveVersion ? '' : 'line-clamp-2'}>
            <VersionComparison version={version} compareVersion={compareVersion} />
          </div>
        )}
      </div>
    </VerticalBarWrapper>
  )
}

export function VersionLabels<Version extends PromptVersion | ChainVersion>({
  version,
  colors,
  hideChainReferences,
  hideEndpointReferences,
  noWrap,
}: {
  version: Version
  colors: Record<string, string>
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
  noWrap?: boolean
}) {
  const usedInChain = 'used in Chain'
  const usedAsEndpoint = 'used as Endpoint'
  const extraColor = 'bg-pink-100 text-black'
  const extraColors = { [usedInChain]: extraColor, [usedAsEndpoint]: extraColor }
  const extraIcons = { [usedInChain]: chainIcon, [usedAsEndpoint]: endpointIcon }
  const extraLabels = [
    ...(!hideChainReferences && 'usedInChain' in version && version.usedInChain ? [usedInChain] : []),
    ...(!hideEndpointReferences && version.usedAsEndpoint ? [usedAsEndpoint] : []),
  ]

  return (
    <ItemLabels
      labels={[...version.labels, ...extraLabels]}
      colors={{ ...colors, ...extraColors }}
      icons={extraIcons}
      noWrap={noWrap}
    />
  )
}

export function ItemLabels({
  labels,
  colors,
  icons = {},
  noWrap,
}: {
  labels: string[]
  colors: Record<string, string>
  icons?: Record<string, any>
  noWrap?: boolean
}) {
  return labels.length > 0 ? (
    <div className={`flex flex-wrap gap-1 ${noWrap ? 'overflow-hidden max-h-5' : ''}`}>
      {labels.map((label, labelIndex) => (
        <ItemLabel label={label} colors={colors} icons={icons} key={labelIndex} />
      ))}
    </div>
  ) : null
}

export function ItemLabel({
  label,
  colors,
  icons = {},
}: {
  label: string
  colors: Record<string, string>
  icons?: Record<string, any>
}) {
  const color = colors[label] ?? 'bg-gray-400'
  const icon = icons[label]
  return (
    <span className={`pl-1 pr-1.5 text-xs gap-0.5 flex items-center whitespace-nowrap rounded ${color}`}>
      {icon ? <Icon icon={icon} className='-my-0.5' /> : null}
      {label}
    </span>
  )
}

function UserDetails({ user }: { user: User }) {
  return (
    <div className='flex items-center gap-1 text-xs'>
      <UserAvatar user={user} size='sm' />
      <span className='font-normal'>{user.fullName}</span>
    </div>
  )
}

function VerticalBarWrapper({
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
  const isSingleItem = sequenceNumber === 1 && !hasStroke

  return (
    <div id={id} className='flex items-stretch gap-4'>
      {!isSingleItem && (
        <div className='flex flex-col items-end w-10 gap-1 -ml-2'>
          {sequenceNumber !== undefined && (
            <div className='flex items-center gap-2'>
              <span className={`${isFilled ? 'text-gray-700' : 'text-gray-300'} text-xs font-medium`}>
                {sequenceNumber}
              </span>
              <div className={`rounded-full w-2.5 h-2.5 ${isFilled ? 'bg-dark-gray-700' : 'border border-gray-400'}`} />
            </div>
          )}
          {hasStroke && (
            <div className={`border-l flex-1 mb-1 pr-1 border-gray-300 ${isDashed ? 'border-dashed' : ''}`} />
          )}
        </div>
      )}
      {children}
    </div>
  )
}
