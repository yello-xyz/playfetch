import { FormatCost, FormatDate } from '@/common/formatting'
import { Run } from '@/types'

export default function RunTimeline({ runs }: { runs: Run[] }) {
  return runs.length ? (
    <div className='flex flex-col h-full gap-2'>
      <div className='font-medium text-gray-600'>Results</div>
      <div className='flex flex-col flex-1 gap-2 overflow-y-auto'>
        {runs.map((run, index) => (
          <div key={index} className='flex flex-col gap-3 p-4 rounded-lg bg-sky-50'>
            {run.output}
            <div className='self-end text-xs'>
              {FormatCost(run.cost)} • {FormatDate(run.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null
}
