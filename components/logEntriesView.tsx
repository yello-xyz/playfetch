import { ActiveProject, LogEntry, ResolvedEndpoint } from '@/types'
import { ReactNode } from 'react'
import promptIcon from '@/public/prompt.svg'
import chainIcon from '@/public/chain.svg'
import Icon from './icon'

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
      <div className='flex flex-col'>
        {logEntries.map((logEntry, index) => (
          <div key={index}>{logEntry.timestamp}</div>
        ))}
      </div>
    </>
  )
}
