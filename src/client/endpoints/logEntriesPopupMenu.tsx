import { PopupContent, PopupMenuItem } from '@/src/client/components/popupMenu'
import { LogEntry } from '@/types'
import { WithDismiss } from '@/src/client/components/globalPopupContext'
import { FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import { stringify } from 'csv-stringify/sync'

export type LogEntriesPopupMenuProps = {
  logEntries: LogEntry[]
}

export default function LogEntriesPopupMenu({ logEntries, withDismiss }: LogEntriesPopupMenuProps & WithDismiss) {
  const dismiss = (callback?: () => void) => (callback ? withDismiss(callback) : undefined)

  const exportLogEntries = () => {
    const rows: string[][] = [
      ['Time', 'Endpoint', 'Environment', 'Cost', 'Duration', 'Inputs', 'Output', 'Error', 'Attempts', 'Cache Hit'],
      ...logEntries.map(entry => [
        FormatDate(entry.timestamp, true, true),
        entry.urlPath,
        entry.flavor,
        FormatCost(entry.cost),
        FormatDuration(entry.duration),
        JSON.stringify(entry.inputs),
        JSON.stringify(entry.output),
        entry.error ?? '',
        entry.attempts.toString(),
        entry.cacheHit.toString(),
      ]),
    ]
    const file = new Blob([stringify(rows)], { type: 'text/csv' })
    const element = document.createElement('a')
    element.href = URL.createObjectURL(file)
    element.download = 'export.csv'
    document.body.appendChild(element)
    element.click()
  }

  return (
    <PopupContent className='w-44'>
      <PopupMenuItem title='Export as CSV' callback={dismiss(exportLogEntries)} />
    </PopupContent>
  )
}
