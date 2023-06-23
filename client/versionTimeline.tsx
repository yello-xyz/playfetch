import { ReactNode, useEffect, useState } from 'react'
import { Project, PromptConfig, Version } from '@/types'
import dotsIcon from '@/public/dots.svg'
import { FormatDate } from '@/common/formatting'
import historyIcon from '@/public/history.svg'
import IconButton from './iconButton'
import VersionPopupMenu from './versionPopupMenu'
import VersionComparison from './versionComparison'

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

const versionFilter = (filter: string) => (version: Version) => {
  const lowerCaseFilter = filter.toLowerCase()
  return (
    version.labels.some(label => label.toLowerCase().includes(lowerCaseFilter)) ||
    version.prompt.toLowerCase().includes(lowerCaseFilter) ||
    version.runs.some(run => run.output.toLowerCase().includes(lowerCaseFilter))
  )
}

export default function VersionTimeline({
  versions,
  project,
  activeVersion,
  setActiveVersion,
  onRefreshPrompt,
}: {
  versions: Version[]
  project?: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  onRefreshPrompt: () => void
}) {
  const [isFocused, setFocused] = useState(true)
  const [filter, setFilter] = useState('')

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500']
  const labelColors = Object.fromEntries(
    (project?.labels ?? []).map((label, index) => [label, colors[index % colors.length]])
  )

  const selectVersion = (version: Version) => {
    setFocused(true)
    setActiveVersion(version)
  }

  if (filter.length && isFocused) {
    setFocused(false)
  }

  const previousVersion = versions.find(version => version.id === activeVersion.previousID)
  const ascendingVersions = versions.slice().reverse()
  const versionsToShow = isFocused
    ? [...(previousVersion ? [previousVersion] : []), activeVersion]
    : ascendingVersions.filter(versionFilter(filter))

  return (
    <>
      <div className='flex flex-col flex-1 overflow-hidden'>
        <input
          className='w-full py-2 mb-4 text-sm bg-white border-gray-300 rounded-lg'
          type='text'
          value={filter}
          onChange={event => setFilter(event.target.value)}
          placeholder='Filter'
        />
        {isFocused && (
          <VerticalBarWrapper strokeStyle='dashed'>
            <div className='flex items-center mb-4 cursor-pointer' onClick={() => setFocused(false)}>
              <img className='w-6 h-6' src={historyIcon.src} />
              View Full History
            </div>
          </VerticalBarWrapper>
        )}
        <div className='flex flex-col overflow-y-auto'>
          {versionsToShow.map((version, index, items) => (
            <VersionCell
              key={index}
              isOnly={versions.length == 1}
              isLast={index === items.length - 1}
              version={version}
              index={ascendingVersions.findIndex(v => v.id === version.id)}
              isActiveVersion={version.id === activeVersion.id}
              previousVersion={previousVersion}
              labelColors={labelColors}
              onSelect={selectVersion}
              onRefreshPrompt={onRefreshPrompt}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function VersionCell({
  version,
  index,
  isOnly,
  isLast,
  isActiveVersion,
  previousVersion,
  labelColors,
  onSelect,
  onRefreshPrompt,
}: {
  version: Version
  index: number
  isOnly: boolean
  isLast: boolean
  isActiveVersion: boolean
  previousVersion?: Version
  labelColors: { [label: string]: string }
  onSelect: (version: Version) => void
  onRefreshPrompt: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatDate(version.timestamp))
  }, [version.timestamp])

  return (
    <VerticalBarWrapper bulletStyle={isActiveVersion ? 'filled' : 'stroked'} strokeStyle={isLast ? 'none' : 'stroked'}>
      <div
        className={`flex-1 border border-gray-300 rounded-lg cursor-pointer p-4 flex flex-col gap-2 mb-2.5 ${
          isActiveVersion ? 'bg-gray-100' : ''
        }`}
        onClick={() => onSelect(version)}>
        <div className='flex items-center gap-2 text-xs font-medium text-gray-800'>
          {`#${index + 1}`}
          <span>|</span>
          {labelForProvider(version.config.provider)}
          <span className='flex-1 font-normal'>{formattedDate}</span>
          {!isOnly && (
            <div className='relative flex'>
              <IconButton icon={dotsIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
              {isMenuExpanded && (
                <div className='absolute right-0 top-7'>
                  <VersionPopupMenu
                    version={version}
                    isMenuExpanded={isMenuExpanded}
                    setIsMenuExpanded={setIsMenuExpanded}
                    onRefreshPrompt={onRefreshPrompt}
                  />
                </div>
              )}
            </div>
          )}
        </div>
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
          <VersionComparison version={version} previousVersion={isActiveVersion ? previousVersion : undefined} />
        </div>
      </div>
    </VerticalBarWrapper>
  )
}

function VerticalBarWrapper({
  bulletStyle = 'none',
  strokeStyle = 'none',
  children,
}: {
  bulletStyle?: 'filled' | 'stroked' | 'none'
  strokeStyle?: 'stroked' | 'dashed' | 'none'
  children: ReactNode
}) {
  const hasBullet = bulletStyle !== 'none'
  const isFilled = bulletStyle === 'filled'
  const hasStroke = strokeStyle !== 'none'
  const isDashed = strokeStyle === 'dashed'

  return (
    <div className='flex items-stretch gap-4'>
      <div className='flex flex-col items-center gap-1 w-2.5'>
        {hasBullet && (
          <div className={`rounded-full w-2.5 h-2.5 ${isFilled ? 'bg-cyan-950' : 'border border-gray-300'}`} />
        )}
        {hasStroke && <div className={`border-l flex-1 mb-1 border-gray-300 ${isDashed ? 'border-dashed' : ''}`} />}
      </div>
      {children}
    </div>
  )
}
