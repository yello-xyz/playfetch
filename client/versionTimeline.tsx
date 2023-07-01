import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { ActivePrompt, PromptConfig, User, Version } from '@/types'
import historyIcon from '@/public/history.svg'
import VersionPopupMenu from './versionPopupMenu'
import VersionComparison from './versionComparison'
import LabelPopupMenu, { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import { UserAvatar } from './userSidebarItem'
import VersionFilters, { BuildVersionFilter, VersionFilter } from './versionFilters'

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
  prompt,
  activeVersion,
  setActiveVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const [isFocused, setFocused] = useState(true)
  const [filters, setFilters] = useState<VersionFilter[]>([])

  const labelColors = AvailableLabelColorsForPrompt(prompt)

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
  }, [activeVersion, isFocused])

  const selectVersion = (version: Version) => {
    setFocused(true)
    setActiveVersion(version)
  }
  if (filters.length && isFocused) {
    setFocused(false)
  }

  const versions = prompt.versions
  const ascendingVersions = versions.slice().reverse()
  const activeIndex = ascendingVersions.findIndex(version => version.id === activeVersion.id)
  const previousIndex = ascendingVersions.findIndex(version => version.id === activeVersion.previousID)
  const versionsToShow = isFocused ? ascendingVersions : ascendingVersions.filter(BuildVersionFilter(filters))

  return versions.length > 1 || versions[0].runs.length > 0 ? (
    <>
      <div ref={containerRef} className='relative flex min-h-0'>
        <div className={`flex flex-col w-full ${versionsToShow.length > 0 ? 'overflow-hidden' : ''}`}>
          <VersionFilters
            users={prompt.users}
            labelColors={labelColors}
            versions={versions}
            filters={filters}
            setFilters={setFilters}
          />
          <div ref={scrollRef} className='flex flex-col overflow-y-auto'>
            {versionsToShow.map((version, index) =>
              !isFocused || index <= previousIndex || index >= activeIndex ? (
                <VersionCell
                  key={index}
                  isOnly={versions.length == 1}
                  isLast={index === versionsToShow.length - 1}
                  labelColors={labelColors}
                  version={version}
                  index={ascendingVersions.findIndex(v => v.id === version.id)}
                  isActiveVersion={version.id === activeVersion.id}
                  compareVersion={versions.find(v => v.id === version.previousID)}
                  prompt={prompt}
                  onSelect={selectVersion}
                  containerRect={containerRect}
                />
              ) : index === previousIndex + 1 ? (
                <VerticalBarWrapper key={index} strokeStyle='dashed'>
                  <div className='flex items-center mb-4 cursor-pointer' onClick={() => setFocused(false)}>
                    <img className='w-6 h-6' src={historyIcon.src} />
                    View Full History
                  </div>
                </VerticalBarWrapper>
              ) : null
            )}
          </div>
        </div>
      </div>
    </>
  ) : (
    <div />
  )
}

function VersionCell({
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
              <div className={`px-1.5 py-px text-xs text-white rounded ${labelColors[label]}`} key={labelIndex}>
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
