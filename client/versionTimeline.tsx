import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { Project, PromptConfig, User, Version, isProperProject } from '@/types'
import historyIcon from '@/public/history.svg'
import VersionPopupMenu from './versionPopupMenu'
import VersionComparison from './versionComparison'
import LabelPopupMenu, { LabelColorsFromProject } from './labelPopupMenu'
import { UserAvatar } from './userSidebarItem'

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

type VersionFilter = { user: User } | { label: string } | { text: string }

const versionFilter = (filters: VersionFilter[]) => (version: Version) => {
  const userFilters = filters.filter(filter => 'user' in filter).map(filter => (filter as { user: User }).user)
  const userFilter = (version: Version) => !userFilters.length || userFilters.some(user => user.id === version.userID)

  const labelFilters = filters.filter(filter => 'label' in filter).map(filter => (filter as { label: string }).label)
  const labelFilter = (version: Version) =>
    !labelFilters.length || version.labels.some(label => labelFilters.includes(label))

  const textFilters = filters
    .filter(filter => 'text' in filter)
    .map(filter => (filter as { text: string }).text.toLowerCase())
  const textFilter = (version: Version) =>
    !textFilters.length || textFilters.every(filter => version.prompt.toLowerCase().includes(filter))

  return userFilter(version) && labelFilter(version) && textFilter(version)
}

function useScrollDetection(callback: () => void, element: RefObject<HTMLDivElement>) {
  let frame = 0
  const debouncedCallback = () => {
    if (frame) {
      cancelAnimationFrame(frame)
    }
    frame = requestAnimationFrame(() => {
      callback()
    })
  }

  useEffect(() => {
    callback()
    element.current?.addEventListener('scroll', debouncedCallback, { passive: true })
    return () => {
      element.current?.removeEventListener('scroll', debouncedCallback)
    }
  }, [element.current])
}

export default function VersionTimeline({
  users,
  versions,
  project,
  activeVersion,
  setActiveVersion,
}: {
  users: User[]
  versions: Version[]
  project: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const [isFocused, setFocused] = useState(true)
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerRect, setContainerRect] = useState<DOMRect>()
  useEffect(() => setContainerRect(containerRef.current?.getBoundingClientRect()), [containerRef.current])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [_, forceStateUpdate] = useState(0)
  useScrollDetection(() => forceStateUpdate(scrollRef.current?.scrollTop ?? 0), scrollRef)

  useEffect(() => {
    const element = document.getElementById(activeVersion.id.toString())
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeVersion])

  const selectVersion = (version: Version) => {
    setFocused(true)
    setActiveVersion(version)
  }
  if (filters.length && isFocused) {
    setFocused(false)
  }

  const ascendingVersions = versions.slice().reverse()
  const index = ascendingVersions.findIndex(version => version.id === activeVersion.id)
  const previousIndex = ascendingVersions.findIndex(version => version.id === activeVersion.previousID) + 1
  const versionsToShow = isFocused
    ? [...ascendingVersions.slice(0, previousIndex), ...ascendingVersions.slice(index)]
    : ascendingVersions.filter(versionFilter(filters))

  return versions.length > 1 || versions[0].runs.length > 0 ? (
    <>
      <div ref={containerRef} className='relative flex min-h-0'>
        <div className='flex flex-col w-full overflow-hidden'>
          <input
            className='p-2 mb-4 text-sm bg-white border border-gray-300 rounded-lg'
            type='text'
            value={filters.map(filter => ('text' in filter ? filter.text : '')).join(' ')}
            onChange={event => setFilters([{ text: event.target.value }])}
            placeholder='Filter'
          />
          {isFocused && versionsToShow.length < versions.length && (
            <VerticalBarWrapper strokeStyle='dashed'>
              <div className='flex items-center mb-4 cursor-pointer' onClick={() => setFocused(false)}>
                <img className='w-6 h-6' src={historyIcon.src} />
                View Full History
              </div>
            </VerticalBarWrapper>
          )}
          <div ref={scrollRef} className='flex flex-col overflow-y-auto'>
            {versionsToShow.map((version, index, items) => (
              <VersionCell
                key={index}
                isOnly={versions.length == 1}
                isLast={index === items.length - 1}
                users={users}
                version={version}
                index={ascendingVersions.findIndex(v => v.id === version.id)}
                isActiveVersion={version.id === activeVersion.id}
                compareVersion={versions.find(v => v.id === version.previousID)}
                project={project}
                onSelect={selectVersion}
                containerRect={containerRect}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  ) : (
    <div />
  )
}

function VersionCell({
  users,
  version,
  index,
  isOnly,
  isLast,
  isActiveVersion,
  compareVersion,
  project,
  onSelect,
  containerRect,
}: {
  users: User[]
  version: Version
  index: number
  isOnly: boolean
  isLast: boolean
  isActiveVersion: boolean
  compareVersion?: Version
  project: Project
  onSelect: (version: Version) => void
  containerRect?: DOMRect
}) {
  const labelColors = LabelColorsFromProject(project)
  const user = users.find(user => user.id === version.userID)

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
            {isProperProject(project) && (
              <LabelPopupMenu containerRect={containerRect} project={project} version={version} />
            )}
            {!isOnly && <VersionPopupMenu containerRect={containerRect} version={version} />}
          </div>
        </div>
        {user && project.id !== user.id && <UserDetails user={user} />}
        {version.labels.length > 0 && (
          <div className='flex gap-1'>
            {version.labels.map((label, labelIndex) => (
              <div
                className='px-1.5 text-xs flex items-center gap-1 rounded border border-gray-300 py-0.5'
                key={labelIndex}>
                {labelColors[label] && <div className={`w-1.5 h-1.5 rounded-full ${labelColors[label]}`} />}
                {label}
              </div>
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

function UserDetails({ user }: { user: User }) {
  return (
    <div className='flex items-center gap-1 text-xs'>
      <UserAvatar user={user} size='small' />
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
