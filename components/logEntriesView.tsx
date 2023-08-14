import { ActiveProject, LogEntry, ResolvedEndpoint } from '@/types'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from './icon'
import TableCell, { TableHeader } from './TableCell'
import { FormatDate } from '@/src/common/formatting'

export default function LogEntriesView({
  tabSelector,
  logEntries,
  endpoints,
  activeIndex,
  setActiveIndex,
}: {
  tabSelector: ReactNode
  logEntries: LogEntry[]
  endpoints: ResolvedEndpoint[]
  activeIndex?: number
  setActiveIndex: (index: number) => void
}) {
  return (
    <>
      {tabSelector}
      <div className={`grid w-full grid-cols-[minmax(80px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)]`}>
        <TableHeader first>Endpoint</TableHeader>
        <TableHeader>Environment</TableHeader>
        <TableHeader>Time</TableHeader>
        <TableHeader>Status</TableHeader>
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
    </>
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
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => setFormattedDate(FormatDate(logEntry.timestamp, true, true)), [logEntry.timestamp])

  const SelectableCell = ({ children, center, first }: { children: ReactNode; center?: boolean; first?: boolean }) => (
    <TableCell center={center} first={first} active={isActive} callback={setActive}>
      {children}
    </TableCell>
  )
  return endpoint ? (
    <Fragment>
      <SelectableCell first>
        {endpoint.urlPath}
      </SelectableCell>
      <SelectableCell>{endpoint.flavor}</SelectableCell>
      <SelectableCell>{formattedDate}</SelectableCell>
      <SelectableCell>{logEntry.error ? 'Error' : 'Success'}</SelectableCell>
    </Fragment>
  ) : null
}
