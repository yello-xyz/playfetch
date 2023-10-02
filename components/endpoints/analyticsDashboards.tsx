import { FormatCost, FormatDate } from '@/src/common/formatting'
import { Analytics, Usage } from '@/types'
import { ReactElement } from 'react'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import DashboardContainer from './dashboardContainer'

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

export default function AnalyticsDashboards({
  analytics,
  refreshAnalytics,
}: {
  analytics?: Analytics
  refreshAnalytics: (dayRange: number) => void
}) {
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

  const dayRange = recentUsage.length
  const toggleDayRange = () => refreshAnalytics(dayRange === 30 ? 7 : 30)

  return totalRequests > 0 ? (
    <div className='flex gap-4'>
      <DashboardContainer
        title='Total requests'
        value={totalRequests}
        percentIncrement={incrementalRequests}
        range={dayRange}
        callback={toggleDayRange}>
        <AreaChart id='requests' data={data} margin={{ ...margin }}>
          <Area type='bump' strokeWidth={1.5} stackId='1' dataKey='failures' stroke='#DC4F30' fill='#FDE5E0' />
          <Area type='bump' strokeWidth={1.5} stackId='1' dataKey='success' stroke='#71B892' fill='#DDF1E7' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </AreaChart>
      </DashboardContainer>
      <DashboardContainer
        title='Total cost'
        value={FormatCost(totalCost)}
        percentIncrement={incrementalCost}
        lowerIsBetter
        range={dayRange}
        callback={toggleDayRange}>
        <AreaChart id='cost' data={data} margin={margin}>
          <Area type='bump' strokeWidth={1.5} dataKey='cost' stroke='#61A2EE' fill='#DCEAFA' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </AreaChart>
      </DashboardContainer>
      <DashboardContainer
        title='Average duration'
        value={`${minAverageDuration.toFixed(2)}-${maxAverageDuration.toFixed(2)}s`}
        range={recentUsage.length}
        callback={toggleDayRange}>
        <BarChart id='duration' data={data} margin={{ ...margin, left: 10, right: 10 }}>
          <Bar type='bump' dataKey='duration' fill='#BEA4F6' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} />
        </BarChart>
      </DashboardContainer>
    </div>
  ) : null
}
