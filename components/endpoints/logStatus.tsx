export default function LogStatus({ isError, padding = 'px-1.5' }: { isError: boolean; padding?: string }) {
  return (
    <div
      className={`${padding} rounded flex items-center text-xs text-white ${isError ? 'bg-red-300' : 'bg-green-300'}`}>
      {isError ? 'Error' : 'Success'}
    </div>
  )
}
