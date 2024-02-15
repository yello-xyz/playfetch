import { Chain, ChainVersion, ProjectItemIsChain, LogEntry, Prompt, PromptVersion } from '@/types'
import { FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import collapseIcon from '@/public/collapse.svg'
import IconButton from '@/src/client/components/iconButton'
import Icon from '@/src/client/components/icon'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Label from '@/src/client/components/label'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import { SingleTabHeader } from '@/src/client/components/tabsHeader'
import CodeBlock from '@/src/client/components/codeBlock'
import LogStatus from './logStatus'
import { ReactNode, useState } from 'react'
import Collapsible from '@/src/client/components/collapsible'

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

  const [areAllEntriesExpanded, setAllEntriesExpanded] = useState<boolean>()
  const setExpanded = (expanded: boolean, shiftClick: boolean) => shiftClick && setAllEntriesExpanded(expanded)

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
              isExpanded={areAllEntriesExpanded}
              setExpanded={setExpanded}>
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
  isExpanded,
  setExpanded,
  children,
}: {
  timestamp: number
  collapsible?: boolean
  isExpanded?: boolean
  setExpanded: (expanded: boolean, shiftClick: boolean) => void
  children: ReactNode
}) {
  const formattedDate = useFormattedDate(timestamp, timestamp => FormatDate(timestamp, true, true))

  return collapsible ? (
    <Collapsible
      initiallyExpanded={isExpanded ?? true}
      onSetExpanded={setExpanded}
      title={formattedDate}
      contentClassName='flex flex-col gap-6 pt-2 ml-6'>
      {children}
    </Collapsible>
  ) : (
    <>{children}</>
  )
}
