import { Chain, ChainVersion, ProjectItemIsChain, LogEntry, Prompt, PromptVersion } from '@/types'
import { FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import collapseIcon from '@/public/collapse.svg'
import IconButton from '../iconButton'
import Icon from '../icon'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Label from '../label'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { SingleTabHeader } from '../tabSelector'
import CodeBlock from '../codeBlock'
import LogStatus from './logStatus'
import { ReactNode, useState } from 'react'
import chevronIcon from '@/public/chevron.svg'

export default function LogEntryDetailsPane({
  logEntries,
  parent,
  versions,
  onCollapse,
}: {
  logEntries: LogEntry[]
  parent?: Prompt | Chain
  versions: PromptVersion[] | ChainVersion[]
  onCollapse: () => void
}) {
  const logEntry = logEntries[0]
  const formattedDate = useFormattedDate(logEntry.timestamp, timestamp => FormatDate(timestamp, true, true))

  const versionIndex = versions.findIndex(version => version.id === logEntry.versionID)

  const failedAttempts = logEntries.reduce((sum, entry) => sum + (entry.attempts - 1), 0)
  const cost = logEntries.reduce((sum, entry) => sum + entry.cost, 0)
  const duration = logEntries.reduce((sum, entry) => sum + entry.duration, 0) / logEntries.length
  const multipleLogEntries = logEntries.length > 1

  const gridConfig = 'grid grid-cols-[160px_minmax(0,1fr)]'
  return (
    <div className='flex flex-col w-full h-full bg-gray-25'>
      <SingleTabHeader label={logEntry.urlPath} secondaryLabel={formattedDate}>
        {onCollapse && <IconButton icon={collapseIcon} onClick={onCollapse} />}
      </SingleTabHeader>
      <div className='flex flex-col gap-6 p-4 overflow-y-auto'>
        <div className={`${gridConfig} w-full items-center gap-4 p-6 py-4 bg-white border border-gray-200 rounded-lg`}>
          {parent && (
            <>
              {ProjectItemIsChain(parent) ? 'Chain' : 'Prompt'}
              <div className='flex items-center justify-end gap-1 whitespace-nowrap'>
                <Icon icon={ProjectItemIsChain(parent) ? chainIcon : promptIcon} />
                <span className='flex-shrink overflow-hidden whitespace-nowrap text-ellipsis'>{parent.name}</span>
                {versionIndex >= 0 && ` - Version ${versionIndex + 1}`}
              </div>
            </>
          )}
          <span>Environment</span>
          <span className='flex justify-end'>{logEntry.flavor}</span>
          <span>Status</span>
          <div className='flex justify-end'>
            <LogStatus padding='px-1.5 py-[3px]' isError={!!logEntry.error} />
          </div>
          {failedAttempts > 0 && (
            <>
              <span>Failed Attempts</span>
              <span className='flex justify-end'>{failedAttempts}</span>
            </>
          )}
          {cost > 0 && (
            <>
              <span>{multipleLogEntries ? 'Total Cost' : 'Cost'}</span>
              <span className='flex justify-end'>{FormatCost(cost)}</span>
            </>
          )}
          <span>{multipleLogEntries ? 'Average Duration' : 'Duration'}</span>
          <span className='flex justify-end'>{FormatDuration(duration)}</span>
          {!multipleLogEntries && (
            <>
              <span>Cache Hit</span>
              <span className='flex justify-end'>{logEntry.cacheHit ? 'Yes' : 'No'}</span>
            </>
          )}
        </div>
        {logEntries
          .slice()
          .reverse()
          .map((logEntry, index) => (
            <CollapsibleContent
              key={index}
              timestamp={logEntry.timestamp}
              collapsible={multipleLogEntries}
              initiallyExpanded={index === 0}>
              {Object.keys(logEntry.inputs).length > 0 && (
                <>
                  <Label className='-mb-4'>Request</Label>
                  <CodeBlock>{JSON.stringify(logEntry.inputs, null, 2)}</CodeBlock>
                </>
              )}
              {logEntry.error ? (
                <>
                  <Label className='-mb-4'>Error</Label>
                  <CodeBlock error>{logEntry.error}</CodeBlock>
                </>
              ) : (
                <>
                  <Label className='-mb-4'>Response</Label>
                  <CodeBlock>{JSON.stringify(logEntry.output, null, 2)}</CodeBlock>
                </>
              )}
            </CollapsibleContent>
          ))}
      </div>
    </div>
  )
}

function CollapsibleContent({
  timestamp,
  collapsible = true,
  initiallyExpanded = false,
  children,
}: {
  timestamp: number
  collapsible?: boolean
  initiallyExpanded?: boolean
  children: ReactNode
}) {
  const [isExpanded, setExpanded] = useState(initiallyExpanded)
  const formattedDate = useFormattedDate(timestamp, timestamp => FormatDate(timestamp, true, true))

  return collapsible ? (
    <div>
      <div className='flex items-center cursor-pointer' onClick={() => setExpanded(!isExpanded)}>
        <Icon className={`${isExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />
        <span className='font-medium text-gray-700'>{formattedDate}</span>
      </div>
      {isExpanded && <div className='flex flex-col gap-6 pt-2 ml-6'>{children}</div>}
    </div>
  ) : (
    <>{children}</>
  )
}
