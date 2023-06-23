import { ReactNode, useEffect, useState } from 'react'
import { PromptConfig, Version } from '@/types'
import simplediff from 'simplediff'
import dotsIcon from '@/public/dots.svg'
import { FormatDate } from '@/common/formatting'
import historyIcon from '@/public/history.svg'
import IconButton from './iconButton'
import VersionPopupMenu from './versionPopupMenu'

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
    version.labels.toLowerCase().includes(lowerCaseFilter) ||
    version.prompt.toLowerCase().includes(lowerCaseFilter) ||
    version.runs.some(run => run.output.toLowerCase().includes(lowerCaseFilter))
  )
}

type ComparisonState = '=' | '-' | '+'
const classNameForDiff = ({ state, tagged }: { state: ComparisonState; tagged: boolean }) => {
  const taggedClassName = tagged ? 'font-bold' : ''
  switch (state) {
    case '=':
      return taggedClassName
    case '-':
      return `bg-red-300 ${taggedClassName}`
    case '+':
      return `bg-green-200 ${taggedClassName}`
  }
}

const renderDiffs = (parts: { 0: ComparisonState; 1: string[] }[]) => {
  const result = []
  let tagged = false
  const startSentinel = '{{'
  const endSentinel = '}}'

  for (const part of parts) {
    const state = part[0]
    let content = part[1].join('')
    while (content.length > 0) {
      const start = content.indexOf(startSentinel)
      const end = content.indexOf(endSentinel)
      if (start < 0 && end < 0) {
        result.push({ state, content, tagged })
        break
      } else if (start >= 0 && (end < 0 || start < end)) {
        result.push({ state, content: content.substring(0, start + (tagged ? startSentinel.length : 0)), tagged })
        content = content.substring(start + startSentinel.length)
        tagged = true
      } else {
        result.push({ state, content: content.substring(0, end + (tagged ? 0 : endSentinel.length)), tagged })
        content = content.substring(end + endSentinel.length)
        tagged = false
      }
    }
  }

  return result.map((diff, index: number) => (
    <span key={index} className={classNameForDiff(diff)}>
      {diff.content}
    </span>
  ))
}

const tokenize = (prompt: string) => {
  const delimiters = ' .,;:!?-_()[]<>"\'\n\t'
  const tokens = [] as string[]
  let currentCharacters = [] as string[]
  for (const character of prompt) {
    if (delimiters.includes(character)) {
      if (currentCharacters.length) {
        tokens.push(currentCharacters.join(''))
        currentCharacters = []
      }
      tokens.push(character)
    } else {
      currentCharacters.push(character)
    }
  }
  if (currentCharacters.length) {
    tokens.push(currentCharacters.join(''))
  }
  return tokens
}

const renderPrompt = (prompt: string, comparison?: string) =>
  renderDiffs(comparison ? simplediff.diff(tokenize(comparison), tokenize(prompt)) : [['=', [prompt]]])

export default function VersionTimeline({
  versions,
  activeVersion,
  setActiveVersion,
  onRefreshPrompt,
}: {
  versions: Version[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  onRefreshPrompt: () => void
}) {
  const [isFocused, setFocused] = useState(true)
  const [filter, setFilter] = useState('')

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
  onSelect,
  onRefreshPrompt,
}: {
  version: Version
  index: number
  isOnly: boolean
  isLast: boolean
  isActiveVersion: boolean
  previousVersion?: Version
  onSelect: (version: Version) => void
  onRefreshPrompt: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatDate(version.timestamp))
  }, [version.timestamp])

  const renderPromptVersion = (version: Version) =>
    renderPrompt(version.prompt, previousVersion && isActiveVersion ? previousVersion.prompt : undefined)

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
            {version.labels
              .split(', ')
              .map(label => label.trim())
              .filter(label => label.length)
              .map((label, labelIndex) => (
                <div className='px-1 text-xs bg-blue-300 rounded py-0.5' key={labelIndex}>
                  {label}
                </div>
              ))}
          </div>
        )}
        <div className={isActiveVersion ? '' : 'line-clamp-2'}>{renderPromptVersion(version)}</div>
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
