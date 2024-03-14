import { PopupContent, PopupMenuItem } from '@/src/client/components/popupMenu'
import { LogEntry } from '@/types'
import { WithDismiss } from '@/src/client/components/globalPopupContext'
import { FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import { stringify } from 'csv-stringify/sync'
import { useActiveProject } from '../projects/projectContext'
import useModalDialogPrompt from '../components/modalDialogContext'
import { useRef } from 'react'
import api from '../api'

export const exportLogEntries = (logEntries: LogEntry[]) => {
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

type LogEntriesPopupMenuProps = {
  logEntries: LogEntry[]
  exportAllLogs: () => void
}

function LogEntriesPopupMenu({
  logEntries,
  exportAllLogs,
  withDismiss,
}: LogEntriesPopupMenuProps & WithDismiss) {
  const dismiss = (callback?: () => void) => (callback ? withDismiss(callback) : undefined)

  return (
    <PopupContent className='w-44'>
      <PopupMenuItem title='Export View as CSV' callback={dismiss(() => exportLogEntries(logEntries))} />
      <PopupMenuItem title='Export All Logs as CSV' callback={dismiss(exportAllLogs)} />
    </PopupContent>
  )
}

export default function useLogEntriesPopupMenu(logEntries: LogEntry[]) {
  const activeProject = useActiveProject()
  const setDialogPrompt = useModalDialogPrompt()
  const cancelledExport = useRef(false)

  const exportAllLogs = async () => {
    cancelledExport.current = false

    setDialogPrompt({
      title: 'Exporting All Logs',
      content: 'Exporting endpoint log entries for project. This could take a while…',
      confirmTitle: 'Cancel',
      callback: () => {
        cancelledExport.current = true
      },
      cancellable: false,
      dismissable: false,
      destructive: true,
    })

    const allLogEntries: LogEntry[] = []
    let cursors: (string | null)[] = []
    while (cursors.slice(-1)[0] !== null && !cancelledExport.current) {
      const analytics = await api.getAnalytics(activeProject.id, 1, cursors as string[])
      allLogEntries.push(...analytics.recentLogEntries)
      cursors = analytics.logEntryCursors
    }

    if (!cancelledExport.current) {
      exportLogEntries(allLogEntries)
      setDialogPrompt(undefined)
    }
  }

  const showPopupMenu = (): [typeof LogEntriesPopupMenu, LogEntriesPopupMenuProps] => [
    LogEntriesPopupMenu,
    { logEntries, exportAllLogs },
  ]

  return showPopupMenu
}
