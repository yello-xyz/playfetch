export const LogStatusForError = (error?: string) => (error ? 'Error' : 'Success')
export const ColorForLogStatus = (status: string) => (status === 'Error' ? 'bg-red-300' : 'bg-green-300')

export default function LogStatus({ error, padding = 'px-1.5' }: { error: string | undefined; padding?: string }) {
  const logStatus = LogStatusForError(error)
  return (
    <div className={`${padding} rounded flex items-center text-xs text-white ${ColorForLogStatus(logStatus)}`}>
      {logStatus}
    </div>
  )
}
