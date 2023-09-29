import { FormatCost, FormatDate } from '@/src/common/formatting'
import { Usage } from '@/types'
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

export default function AnalyticsDashboards({ analytics }: { analytics: Usage[] }) {
  const margin = { left: 0, right: 0, top: 10, bottom: 0 }

  const totalRequests = analytics.reduce((acc, usage) => acc + usage.requests, 0)
  const totalCost = analytics.reduce((acc, usage) => acc + usage.cost, 0)
  const minAverageDuration = analytics.reduce((acc, usage) => {
    return usage.duration === 0
      ? acc
      : acc === 0
      ? usage.duration / (usage.requests || 1)
      : Math.min(acc, usage.duration / (usage.requests || 1))
  }, 0)
  const maxAverageDuration = analytics.reduce(
    (acc, usage) => Math.max(acc, usage.duration / (usage.requests || 1)),
    minAverageDuration
  )
  const data = prepareData(analytics)

  return totalRequests > 0 ? (
    <div className='flex gap-4'>
      <Container title='Total requests' value={totalRequests}>
        <AreaChart id='requests' data={data} margin={{ ...margin }}>
          <Area type='bump' strokeWidth={1.5} stackId='1' dataKey='failures' stroke='#DC4F30' fill='#FDE5E0' />
          <Area type='bump' strokeWidth={1.5} stackId='1' dataKey='success' stroke='#71B892' fill='#DDF1E7' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </AreaChart>
      </Container>
      <Container title='Total cost' value={FormatCost(totalCost)}>
        <AreaChart id='cost' data={data} margin={margin}>
          <Area type='bump' strokeWidth={1.5} dataKey='cost' stroke='#61A2EE' fill='#DCEAFA' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </AreaChart>
      </Container>
      <Container title='Average duration' value={`${minAverageDuration.toFixed(2)}-${maxAverageDuration.toFixed(2)}s`}>
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
  children,
}: {
  title?: string
  value?: string | number
  children: ReactElement<any>
}) {
  return (
    <div className='flex flex-col flex-1 bg-white border border-gray-200 rounded-md'>
      <div className='flex flex-col px-4 pt-3'>
        <div className='flex flex-wrap items-baseline justify-between overflow-hidden max-h-[19px]'>
          <span className='font-medium text-gray-400'>{title}</span>
          <span className='text-xs font-medium text-gray-300'>last 30 days</span>
        </div>
        <span className='text-lg font-bold text-gray-800'>{value}</span>
      </div>
      <div className='relative w-full pb-40'>
        <div className='absolute inset-0'>
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
