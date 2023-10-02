import { FormatCost, FormatDate } from '@/src/common/formatting'
import { Analytics, Usage } from '@/types'
import { ReactElement } from 'react'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const daysAgo = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

const prepareData = (analytics: Usage[]) =>
  analytics
    .reduce((acc, usage) => [...acc, { ...usage, cost: (acc[acc.length - 1]?.cost ?? 0) + usage.cost }], [] as Usage[])
    .map((usage, index) => ({
      ...usage,
      name: FormatDate(daysAgo(new Date(), 30 - index).getTime(), false, true),
      cost: usage.cost.toFixed(2),
      duration: (usage.duration / (usage.requests || 1)).toFixed(2),
      success: usage.requests - usage.failures,
    }))

const percentIncrement = (current: number, previous: number) =>
  Math.round(previous === 0 ? 100 : (100 * (current - previous)) / previous)

export default function AnalyticsDashboards({ analytics }: { analytics?: Analytics }) {
  const margin = { left: 0, right: 0, top: 10, bottom: 0 }

  const recentUsage = analytics?.recentUsage ?? []

  const totalRequests = recentUsage.reduce((acc, usage) => acc + usage.requests, 0)
  const totalCost = recentUsage.reduce((acc, usage) => acc + usage.cost, 0)
  const minAverageDuration = recentUsage.reduce((acc, usage) => {
    return usage.duration === 0
      ? acc
      : acc === 0
      ? usage.duration / (usage.requests || 1)
      : Math.min(acc, usage.duration / (usage.requests || 1))
  }, 0)
  const maxAverageDuration = recentUsage.reduce(
    (acc, usage) => Math.max(acc, usage.duration / (usage.requests || 1)),
    minAverageDuration
  )
  const data = prepareData(recentUsage)

  const incrementalRequests = percentIncrement(totalRequests, analytics?.aggregatePreviousUsage?.requests ?? 0)
  const incrementalCost = percentIncrement(totalCost, analytics?.aggregatePreviousUsage?.cost ?? 0)

  return totalRequests > 0 ? (
    <div className='flex gap-4'>
      <Container
        title='Total requests'
        value={totalRequests}
        percentIncrement={incrementalRequests}
        range={recentUsage.length}>
        <AreaChart id='requests' data={data} margin={{ ...margin }}>
          <Area type='bump' strokeWidth={1.5} stackId='1' dataKey='failures' stroke='#DC4F30' fill='#FDE5E0' />
          <Area type='bump' strokeWidth={1.5} stackId='1' dataKey='success' stroke='#71B892' fill='#DDF1E7' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </AreaChart>
      </Container>
      <Container
        title='Total cost'
        value={FormatCost(totalCost)}
        percentIncrement={incrementalCost}
        range={recentUsage.length}>
        <AreaChart id='cost' data={data} margin={margin}>
          <Area type='bump' strokeWidth={1.5} dataKey='cost' stroke='#61A2EE' fill='#DCEAFA' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </AreaChart>
      </Container>
      <Container
        title='Average duration'
        value={`${minAverageDuration.toFixed(2)}-${maxAverageDuration.toFixed(2)}s`}
        range={recentUsage.length}>
        <BarChart id='duration' data={data} margin={{ ...margin, left: 10, right: 10 }}>
          <Bar type='bump' dataKey='duration' fill='#BEA4F6' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </BarChart>
      </Container>
    </div>
  ) : null
}

function Container({
  title,
  value,
  percentIncrement,
  range,
  children,
}: {
  title?: string
  value?: string | number
  percentIncrement?: number
  range?: number
  children: ReactElement<any>
}) {
  return (
    <div className='flex flex-col flex-1 bg-white border border-gray-200 rounded-md'>
      <div className='flex flex-col px-4 pt-3'>
        <div className='flex flex-wrap items-baseline justify-between overflow-hidden max-h-[19px]'>
          <span className='font-medium text-gray-400'>{title}</span>
          {range && <span className='text-xs font-medium text-gray-300'>last {range} days</span>}
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-bold text-gray-800'>{value}</span>
          {percentIncrement !== undefined && (
            <span
              className={`flex px-1 py-px text-xs rounded ${
                percentIncrement < 0 ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-400'
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
