import { MouseEvent, useEffect, useState } from 'react'
import { PromptConfig, Version } from '@/types'
import simplediff from 'simplediff'
import { HiOutlineTrash } from 'react-icons/hi'
import { FormatDate } from '@/common/formatting'
import LabeledTextInput from './labeledTextInput'
import ModalDialog, { DialogPrompt } from './modalDialog'
import api from './api'
import historyIcon from '@/public/history.svg'

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
    version.tags.toLowerCase().includes(lowerCaseFilter) ||
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
  setDialogPrompt,
}: {
  versions: Version[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  onRefreshPrompt: () => void
  setDialogPrompt: (dialogPrompt: DialogPrompt) => void
}) {
  const [isFocused, setFocused] = useState(true)
  const [filter, setFilter] = useState('')

  const [formattedDates, setFormattedDates] = useState<{ [id: string]: string }>({})
  useEffect(() => {
    setFormattedDates(Object.fromEntries(versions.map(version => [version.id, FormatDate(version.timestamp)])))
  }, [versions])

  const previousVersion = versions.find(version => version.id === activeVersion.previousID)
  const isActiveVersion = (version: Version) => version.id === activeVersion.id
  const renderPromptVersion = (version: Version) =>
    renderPrompt(version.prompt, previousVersion && isActiveVersion(version) ? previousVersion.prompt : undefined)

  const selectVersion = (version: Version) => {
    setFocused(true)
    setActiveVersion(version)
  }

  if (filter.length && isFocused) {
    setFocused(false)
  }

  const deleteVersion = async (event: MouseEvent, version: Version) => {
    event.stopPropagation()
    setDialogPrompt({
      message: `Are you sure you want to delete this version? This action cannot be undone.`,
      callback: async () => {
        await api.deleteVersion(version.id)
        onRefreshPrompt()
      },
      destructive: true,
    })
  }

  const ascendingVersions = versions.slice().reverse()
  const versionsToShow = isFocused
    ? [...(previousVersion ? [previousVersion] : []), activeVersion]
    : ascendingVersions.filter(versionFilter(filter))

  return (
    <>
      <div className='flex flex-col flex-1 gap-4 overflow-hidden'>
        <LabeledTextInput placeholder='Filter' value={filter} setValue={setFilter} />
        {isFocused && (
          <div className='flex items-center cursor-pointer' onClick={() => setFocused(false)}>
            <img className='w-6 h-6' src={historyIcon.src} />
            View Full History
          </div>
        )}
        <div className='flex flex-col overflow-y-auto'>
          {versionsToShow.map((version, index, items) => (
            <div
              key={index}
              className={`border border-gray-300 rounded-lg cursor-pointer p-4 flex flex-col gap-2 mb-2.5 ${
                isActiveVersion(version) ? 'bg-gray-100' : ''
              }`}
              onClick={() => selectVersion(version)}>
              <div className='flex items-center gap-2 text-xs font-medium text-gray-800'>
                {`#${ascendingVersions.findIndex(v => v.id === version.id) + 1}`}
                <span>|</span>
                {labelForProvider(version.config.provider)}
                <span className='flex-1 font-normal'>{formattedDates[version.id]}</span>
                {versions.length > 1 && <HiOutlineTrash onClick={event => deleteVersion(event, version)} />}
              </div>
              {version.tags.length && (
                <div className='flex gap-1'>
                  {version.tags
                    .split(', ')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length)
                    .map((tag, tagIndex) => (
                      <div className='px-1 text-xs bg-blue-300 rounded py-0.5' key={tagIndex}>
                        {tag}
                      </div>
                    ))}
                </div>
              )}
              <div className={isActiveVersion(version) ? '' : 'line-clamp-2'}>{renderPromptVersion(version)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
