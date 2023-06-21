import { Run } from '@/types'

export default function RunTimeline({ runs }: { runs: Run[] }) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='sticky font-medium bg-white top-6 gray-600'>Results</div>
      <div className='sticky h-full overflow-hidden'>
        <div className='flex flex-col flex-1 gap-2'>
          {runs.map((run, index) => (
            <div key={index} className='p-4 bg-gray-100 rounded-lg'>
              {run.output}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
