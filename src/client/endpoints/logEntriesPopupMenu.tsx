import { PopupContent, PopupMenuItem } from '@/src/client/components/popupMenu'
import { LogEntry } from '@/types'
import { WithDismiss } from '@/src/client/components/globalPopupContext'
import { FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import { stringify } from 'csv-stringify/sync'
import { useActiveProject } from '../projects/projectContext'
import api from '../api'

export type LogEntriesPopupMenuProps = {
  logEntries: LogEntry[]
}

export default function LogEntriesPopupMenu({ logEntries, withDismiss }: LogEntriesPopupMenuProps & WithDismiss) {
  const dismiss = (callback?: () => void) => (callback ? withDismiss(callback) : undefined)

  const exportLogEntries = (logEntries: LogEntry[]) => {
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

  const activeProject = useActiveProject()
  const exportAllLogEntries = async () => {
    const allLogEntries: LogEntry[] = []
    let cursors: (string | null)[] = []
    while (cursors.slice(-1)[0] !== null) {
      const analytics = await api.getAnalytics(activeProject.id, 1, cursors as string[])
      allLogEntries.push(...analytics.recentLogEntries)
      cursors = analytics.logEntryCursors
    }
    exportLogEntries(allLogEntries)
  }

  return (
    <PopupContent className='w-44'>
      <PopupMenuItem title='Export View as CSV' callback={dismiss(() => exportLogEntries(logEntries))} />
      <PopupMenuItem title='Export All Logs as CSV' callback={dismiss(exportAllLogEntries)} />
    </PopupContent>
  )
}
