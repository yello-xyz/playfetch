export const LogStatusForError = (error?: string) => error ? 'Error' : 'Success'

export default function LogStatus({ error, padding = 'px-1.5' }: { error: string | undefined; padding?: string }) {
  return (
    <div
      className={`${padding} rounded flex items-center text-xs text-white ${error ? 'bg-red-300' : 'bg-green-300'}`}>
      {LogStatusForError(error)}
    </div>
  )
}
