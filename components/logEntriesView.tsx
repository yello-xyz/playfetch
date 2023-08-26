import { LogEntry, ResolvedEndpoint } from '@/types'
import { ReactNode } from 'react'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from './icon'
import TableCell, { TableHeader } from './tableCell'
import { FormatDate } from '@/src/common/formatting'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'

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
  return (
    <div className='flex flex-col h-full'>
      {tabSelector()}
      <div className='overflow-y-auto'>
        <div className='grid p-4 w-full grid-cols-[minmax(80px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)]'>
          <TableHeader first>Endpoint</TableHeader>
          <TableHeader>Environment</TableHeader>
          <TableHeader>Time</TableHeader>
          <TableHeader last>Status</TableHeader>
          {logEntries.map((logEntry, index) => (
            <LogEntryRow
              key={index}
              logEntry={logEntry}
              endpoint={endpoints.find(endpoint => endpoint.id === logEntry.endpointID)}
              isActive={index === activeIndex}
              setActive={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LogEntryRow({
  logEntry,
  endpoint,
  isActive,
  setActive,
}: {
  logEntry: LogEntry
  endpoint?: ResolvedEndpoint
  isActive: boolean
  setActive: () => void
}) {
  const formattedDate = useFormattedDate(logEntry.timestamp, timestamp => FormatDate(timestamp, true, true))

  const statusColor = logEntry.error ? 'bg-red-300' : 'bg-green-300'
  return endpoint ? (
    <>
      <TableCell first active={isActive} callback={setActive}>
        <div className='flex items-center gap-1'>
          <Icon icon={!!endpoint.versionID ? promptIcon : chainIcon} />
          {endpoint.urlPath}
        </div>
      </TableCell>
      <TableCell active={isActive} callback={setActive}>
        {endpoint.flavor}
      </TableCell>
      <TableCell active={isActive} callback={setActive}>
        {formattedDate}
      </TableCell>
      <TableCell last active={isActive} callback={setActive}>
        <div className={`rounded px-1.5 flex items-center text-white ${statusColor}`}>
          {logEntry.error ? 'Error' : 'Success'}
        </div>
      </TableCell>
    </>
  ) : null
}
