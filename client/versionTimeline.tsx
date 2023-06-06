import { MouseEvent } from 'react'
import { Run, Version } from '@/types'
import simplediff from 'simplediff'
import { Badge, Timeline } from 'flowbite-react'
import { HiOutlineSparkles, HiOutlineTrash, HiPlay } from 'react-icons/hi'
import { FormatDate, Truncate } from '@/common/formatting'

const classNameForComparison = (state: '=' | '-' | '+') => {
  switch (state) {
    case '=':
      return ''
    case '-':
      return 'text-red-600 line-through'
    case '+':
      return 'text-green-600 underline'
  }
}

const renderComparison = (previous: string, current: string) =>
  simplediff
    .diff(previous.split(/[ ]+/), current.split(/[ ]+/))
    .map((part: { 0: '=' | '-' | '+'; 1: string[] }, index: number) => (
      <span key={index}>
        <span className={classNameForComparison(part[0])}>{part[1].join(' ')}</span>{' '}
      </span>
    ))

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
  activeRun,
  setActiveVersion,
  setActiveRun,
  onDelete,
}: {
  versions: Version[]
  activeVersion: Version
  activeRun?: Run
  setActiveVersion: (version: Version) => void
  setActiveRun: (run?: Run) => void
  onDelete: (version: Version) => void
}) {
  const previousVersion = versions.find(version => version.id === activeVersion.previousID)
  const isActiveVersion = (item: Version | Run) => item.id === activeVersion.id
  const renderPrompt = (version: Version) =>
    previousVersion && isActiveVersion(version)
      ? renderComparison(previousVersion.prompt, version.prompt)
      : version.prompt
  const isVersion = (item: Version | Run): item is Version => (item as Version).runs !== undefined
  const toVersion = (item: Version | Run): Version =>
    isVersion(item) ? item : versions.find(version => version.runs.map(run => run.id).includes(item.id))!
  const isPreviousVersion = (item: Version | Run) => !!previousVersion && item.id === previousVersion.id

  const deleteVersion = async (event: MouseEvent, version: Version) => {
    event.stopPropagation()
    onDelete(version)
  }

  const select = async (item: Version | Run) => {
    setActiveVersion(toVersion(item))
    setActiveRun(isVersion(item) ? undefined : item)
  }

  return (
    <Timeline>
      {versions
        .flatMap(version => [version, ...version.runs])
        .map((item, index, items) => (
          <Timeline.Item key={index} className='cursor-pointer' onClick={() => select(item)}>
            <Timeline.Point icon={isVersion(item) ? HiOutlineSparkles : HiPlay} theme={customPointTheme} />
            <Timeline.Content>
              <Timeline.Time className='flex items-center gap-2'>
                {isActiveVersion(item) && '⮕ '}
                {isPreviousVersion(item) && '⬅ '}
                {FormatDate(item.timestamp, index > 0 ? items[index - 1].timestamp : undefined)}
                {isVersion(item) && <HiOutlineTrash onClick={event => deleteVersion(event, item)} />}
                {!isVersion(item) && item.config.length && <Badge color='green'>{item.config}</Badge>}
                {!isVersion(item) && item.cost > 0.0005 && `$${item.cost.toFixed(3)}`}
              </Timeline.Time>
              {isVersion(item) && (
                <Timeline.Title className='flex items-center gap-2'>
                  {item.title}
                  {item.tags
                    .split(', ')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length)
                    .map((tag, tagIndex) => (
                      <Badge key={tagIndex}>{tag}</Badge>
                    ))}
                </Timeline.Title>
              )}
              <Timeline.Body className={isVersion(item) ? '' : 'italic'}>
                {isVersion(item)
                  ? renderPrompt(item)
                  : item.id === activeRun?.id
                  ? item.output
                  : Truncate(item.output, 200)}
              </Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
        ))}
    </Timeline>
  )
}
