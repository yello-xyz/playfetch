export default function LogStatus({ isError }: { isError: boolean }) {
  return (
    <div className={`rounded px-1.5 flex items-center text-xs text-white ${isError ? 'bg-red-300' : 'bg-green-300'}`}>
      {isError ? 'Error' : 'Success'}
    </div>
  )
}
