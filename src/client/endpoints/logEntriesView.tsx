import { LogEntry, ResolvedEndpoint } from '@/types'
import { ReactNode } from 'react'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from '@/src/client/components/icon'
import TableCell, { TableHeader } from '@/src/client/components/tableCell'
import { FormatDate } from '@/src/common/formatting'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import LogStatus from './logStatus'

const sameSequence = (a: LogEntry) => (b: LogEntry) => !!a.continuationID && a.continuationID === b.continuationID

const isLastContinuation = (entry: LogEntry, index: number, entries: LogEntry[]) =>
  entries.slice(0, index).filter(sameSequence(entry)).length > 0

const continuationCount = (entry: LogEntry, index: number, entries: LogEntry[]) =>
  entries.slice(index).filter(sameSequence(entry)).length

export const sameContinuationEntries = (entry: LogEntry, entries: LogEntry[]) =>
  entry.continuationID ? entries.filter(sameSequence(entry)) : [entry]

export default function LogEntriesView({
  tabSelector,
  logEntries,
  endpoints,
  activeIndex,
  setActiveIndex,
}: {
  tabSelector: (children?: ReactNode) => ReactNode
  logEntries: LogEntry[]
  endpoints: ResolvedEndpoint[]
  activeIndex?: number
  setActiveIndex: (index: number) => void
}) {
  const gridConfig = 'grid grid-cols-[minmax(80px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)]'
  return (
    <div className='flex flex-col h-full'>
      {tabSelector()}
      <div className='overflow-y-auto'>
        <div className={`${gridConfig} p-4 w-full`}>
          <TableHeader first>Endpoint</TableHeader>
          <TableHeader>Environment</TableHeader>
          <TableHeader>Time</TableHeader>
          <TableHeader last>Status</TableHeader>
          {logEntries.map((logEntry, index, entries) =>
            isLastContinuation(logEntry, index, entries) ? null : (
              <LogEntryRow
                key={index}
                logEntry={logEntry}
                continuationCount={continuationCount(logEntry, index, entries)}
                endpoint={endpoints.find(endpoint => endpoint.id === logEntry.endpointID)}
                isActive={index === activeIndex}
                setActive={() => setActiveIndex(index)}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function LogEntryRow({
  logEntry,
  continuationCount,
  endpoint,
  isActive,
  setActive,
}: {
  logEntry: LogEntry
  continuationCount: number
  endpoint?: ResolvedEndpoint
  isActive: boolean
  setActive: () => void
}) {
  const formattedDate = useFormattedDate(logEntry.timestamp, timestamp => FormatDate(timestamp, true, true))
  const props = { active: isActive, callback: setActive }

  return endpoint ? (
    <div className='contents group'>
      <TableCell first {...props}>
        <div className='flex items-center gap-1'>
          <Icon icon={!!endpoint.versionID ? promptIcon : chainIcon} />
          {endpoint.urlPath}
          {continuationCount > 1 && (
            <span className='ml-0.5 text-[10px] font-medium px-1 rounded text-white bg-gray-700'>
              {continuationCount}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell {...props}>{endpoint.flavor}</TableCell>
      <TableCell {...props}>{formattedDate}</TableCell>
      <TableCell last {...props}>
        <LogStatus isError={!!logEntry.error} />
      </TableCell>
    </div>
  ) : null
}
