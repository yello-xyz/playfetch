import { LogEntry, ResolvedEndpoint } from '@/types'
import { ReactNode, useState } from 'react'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import pageIcon from '@/public/collapse.svg'
import dotsIcon from '@/public/dots.svg'
import Icon from '@/src/client/components/icon'
import TableCell, { TableHeader } from '@/src/client/components/tableCell'
import { FormatDate } from '@/src/common/formatting'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import LogStatus, { ColorForLogStatus, LogStatusForError } from './logStatus'
import FiltersHeader from '@/src/client/filters/filtersHeader'
import { BuildFilter, Filter, FilterItem } from '@/src/client/filters/filters'
import IconButton from '@/src/client/components/iconButton'
import GlobalPopupMenu from '@/src/client/components/globalPopupMenu'
import LogEntriesPopupMenu, { LogEntriesPopupMenuProps } from './logEntriesPopupMenu'

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
  onNextPage,
  onPreviousPage,
}: {
  tabSelector: (children?: ReactNode) => ReactNode
  logEntries: LogEntry[]
  endpoints: ResolvedEndpoint[]
  activeIndex?: number
  setActiveIndex: (index: number) => void
  onNextPage?: () => void
  onPreviousPage?: () => void
}) {
  const [filters, setFilters] = useState<Filter[]>([])
  const logEntryFilter = (entry: LogEntry, entries: LogEntry[]) =>
    BuildFilter(filters)(filterItemFromLogEntry(entry, entries))

  const filteredLogEntries = logEntries.filter(logEntry => logEntryFilter(logEntry, logEntries))

  const showPopupMenu = (): [typeof LogEntriesPopupMenu, LogEntriesPopupMenuProps] => [
    LogEntriesPopupMenu,
    { logEntries: filteredLogEntries },
  ]

  const gridConfig = 'grid grid-cols-[minmax(80px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)]'
  return (
    <div className='flex flex-col h-full'>
      <FiltersHeader
        items={logEntries.map(entry => filterItemFromLogEntry(entry, logEntries))}
        colorForStatus={ColorForLogStatus}
        filters={filters}
        setFilters={setFilters}
        tabSelector={children =>
          tabSelector(
            <div className='flex items-center'>
              {children} <GlobalPopupMenu icon={dotsIcon} iconClassName='rotate-90' loadPopup={showPopupMenu} />
            </div>
          )
        }
      />
      <div className='overflow-y-auto'>
        <div className={`${gridConfig} relative p-4 w-full`}>
          <TableHeader first>Endpoint</TableHeader>
          <TableHeader>Environment</TableHeader>
          <TableHeader>Time</TableHeader>
          <TableHeader last>Status</TableHeader>
          {(onNextPage || onPreviousPage) && (
            <div className='absolute flex items-center justify-center px-1 border-l border-gray-200 h-9 top-4 right-4'>
              <IconButton
                className={`rotate-180 ${onPreviousPage ? '' : 'opacity-50'}`}
                icon={pageIcon}
                onClick={onPreviousPage}
              />
              <IconButton className={onNextPage ? '' : 'opacity-50'} icon={pageIcon} onClick={onNextPage} />
            </div>
          )}
          {filteredLogEntries.map((logEntry, index, entries) =>
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
        <LogStatus error={logEntry.error} />
      </TableCell>
    </div>
  ) : null
}

const filterItemFromLogEntry = (entry: LogEntry, allEntries: LogEntry[]): FilterItem => {
  const entries = sameContinuationEntries(entry, allEntries)
  return {
    userIDs: [],
    labels: [],
    statuses: entries.map(entry => LogStatusForError(entry.error)),
    contents: [
      ...entries.map(entry => JSON.stringify(entry.output)),
      ...entries.flatMap(entry => Object.entries(entry.inputs).flat()),
      ...entries.map(entry => entry.error ?? ''),
      ...entries.map(entry => entry.flavor),
      ...entries.map(entry => entry.urlPath),
    ],
  }
}
