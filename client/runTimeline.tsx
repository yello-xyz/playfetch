import { Run } from '@/types'

export default function RunTimeline({ runs }: { runs: Run[] }) {
  return (
    <div className='flex flex-col h-full gap-2'>
      <div className='font-medium text-gray-600'>Results</div>
      <div className='flex flex-col flex-1 gap-2 overflow-y-auto'>
        {runs.map((run, index) => (
          <div key={index} className='p-4 bg-gray-100 rounded-lg'>
            {run.output}
          </div>
        ))}
      </div>
    </div>
  )
}
