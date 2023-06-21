import { MouseEvent } from 'react'
import { Version } from '@/types'
import simplediff from 'simplediff'
import { Badge, Timeline, Tooltip } from 'flowbite-react'
import { HiOutlineSparkles, HiOutlineTrash } from 'react-icons/hi'
import { FormatDate } from '@/common/formatting'

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

const customPointTheme = {
  marker: {
    icon: {
      wrapper: 'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white',
    },
  },
}

export default function VersionTimeline({
  versions,
  activeVersion,
  setActiveVersion,
  onDelete,
}: {
  versions: Version[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  onDelete: (version: Version) => void
}) {
  const previousVersion = versions.find(version => version.id === activeVersion.previousID)
  const isActiveVersion = (item: Version) => item.id === activeVersion.id
  const renderPromptVersion = (version: Version) =>
    renderPrompt(version.prompt, previousVersion && isActiveVersion(version) ? previousVersion.prompt : undefined)
  const isPreviousVersion = (item: Version) => !!previousVersion && item.id === previousVersion.id

  const deleteVersion = async (event: MouseEvent, version: Version) => {
    event.stopPropagation()
    onDelete(version)
  }

  return (
    <Timeline>
      {versions
        .slice()
        .reverse()
        .map((version, index, items) => (
          <Timeline.Item key={index} className='cursor-pointer' onClick={() => setActiveVersion(version)}>
            <Timeline.Point icon={HiOutlineSparkles} theme={customPointTheme} />
            <Timeline.Content>
              <Timeline.Time className='flex items-center gap-2'>
                {isActiveVersion(version) && '⮕ '}
                {isPreviousVersion(version) && '⬅ '}
                {`#${index + 1} | `}
                {FormatDate(version.timestamp, index > 0 ? items[index - 1].timestamp : undefined)}
                {versions.length > 1 && (
                  <Tooltip content='Delete version'>
                    <HiOutlineTrash onClick={event => deleteVersion(event, version)} />
                  </Tooltip>
                )}
                {version.config.provider.length && <Badge color='green'>{version.config.provider}</Badge>}
              </Timeline.Time>
              <Timeline.Title className='flex items-center gap-2'>
                {version.tags
                  .split(', ')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length)
                  .map((tag, tagIndex) => (
                    <Badge key={tagIndex}>{tag}</Badge>
                  ))}
              </Timeline.Title>
              <Timeline.Body>{renderPromptVersion(version)}</Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
        ))}
    </Timeline>
  )
}
