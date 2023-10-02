import { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

export default function DashboardContainer({
  title,
  value,
  percentIncrement,
  lowerIsBetter = false,
  range,
  callback,
  children,
}: {
  title?: string
  value?: string | number
  percentIncrement?: number
  lowerIsBetter?: boolean
  range: number
  callback: () => void
  children: ReactElement<any>
}) {
  return (
    <div className='flex flex-col flex-1 bg-white border border-gray-200 rounded-md'>
      <div className='flex flex-col px-4 pt-3'>
        <div className='flex flex-wrap items-baseline justify-between overflow-hidden max-h-[19px]'>
          <span className='font-medium text-gray-400'>{title}</span>
          <span className='text-xs font-medium text-gray-300 cursor-pointer' onClick={callback}>
            last {range} days
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-bold text-gray-800'>{value}</span>
          {percentIncrement && (
            <span
              className={`flex px-1 py-px text-xs rounded ${
                percentIncrement < 0 !== lowerIsBetter ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-400'
              }`}>
              {percentIncrement > 0 ? '+' : ''}
              {percentIncrement}%
            </span>
          )}
        </div>
      </div>
      <div className='relative w-full pb-40'>
        <div className='absolute inset-0'>
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
