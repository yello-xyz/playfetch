import { DaysAgo, FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import { Analytics, Usage } from '@/types'
import { Area, AreaChart, Bar, BarChart, Tooltip, XAxis } from 'recharts'
import DashboardContainer from './dashboardContainer'
import PercentagePieChart from './percentagePieChart'

const prepareData = (analytics: Usage[]) =>
  analytics.map((usage, index, usages) => ({
    ...usage,
    name: FormatDate(DaysAgo(new Date(), usages.length - 1 - index).getTime(), false, true),
    duration: usage.duration / (usage.requests || 1),
    success: usage.requests - usage.failures,
  }))

const percentIncrement = (current: number, previous: number) =>
  Math.round(previous === 0 ? (current === 0 ? 0 : 100) : (100 * (current - previous)) / previous)

export default function AnalyticsDashboards({
  analytics,
  refreshAnalytics,
}: {
  analytics?: Analytics
  refreshAnalytics?: (dayRange: number) => void
}) {
  const margin = { left: 0, right: 0, top: 10, bottom: 0 }

  const recentUsage = analytics?.recentUsage ?? []
  const previousUsage = analytics?.aggregatePreviousUsage ?? { requests: 0, cost: 0, cacheHits: 0 }

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

  const incrementalRequests = percentIncrement(totalRequests, previousUsage.requests)
  const incrementalCost = percentIncrement(totalCost, previousUsage.cost)
  const cacheHits = recentUsage.reduce((acc, usage) => acc + usage.cacheHits, 0) / (totalRequests || 1)
  const incrementalCacheHits = percentIncrement(cacheHits, previousUsage.cacheHits / (previousUsage.requests || 1))

  const dayRange = recentUsage.length
  const canToggleDayRange =
    dayRange === 7 || recentUsage.slice(-2 * 7).reduce((acc, usage) => acc + usage.requests, 0) > 0
  const toggleDayRange =
    canToggleDayRange && refreshAnalytics ? () => refreshAnalytics(dayRange === 30 ? 7 : 30) : undefined

  const formatRequestPayload = (payload: any[]) =>
    `${payload[0].value + payload[1].value} requests${payload[0].value > 0 ? ` (${payload[0].value} failures)` : ''}`
  const formatCostPayload = (payload: any[]) => FormatCost(payload[0].value)
  const hasDurationPayload = (payload: any[]) => payload[0].value > 0
  const formatDurationPayload = (payload: any[]) => FormatDuration(payload[0].value)

  return totalRequests > 0 || previousUsage.requests > 0 ? (
    <div className='flex gap-4'>
      <DashboardContainer
        title='Total requests'
        value={totalRequests}
        percentIncrement={incrementalRequests}
        range={dayRange}
        callback={toggleDayRange}>
        <AreaChart id='requests' data={data} margin={{ ...margin }}>
          <Area type='bump' strokeWidth={1} stackId='1' dataKey='failures' stroke='#DC4F30' fill='#FDE5E0' />
          <Area type='bump' strokeWidth={1} stackId='1' dataKey='success' stroke='#71B892' fill='#DDF1E7' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} content={<CustomTooltip formatter={formatRequestPayload} />} />
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
          <Area type='bump' strokeWidth={1} dataKey='cost' stroke='#61A2EE' fill='#DCEAFA' />
          <XAxis dataKey='name' hide />
          <Tooltip cursor={false} content={<CustomTooltip formatter={formatCostPayload} />} />
        </AreaChart>
      </DashboardContainer>
      {totalRequests > 0 && (
        <DashboardContainer
          title='Average duration'
          value={`${minAverageDuration.toFixed(2)}-${maxAverageDuration.toFixed(2)}s`}
          range={recentUsage.length}
          callback={toggleDayRange}>
          <BarChart id='duration' data={data} margin={{ ...margin, left: 10, right: 10 }}>
            <Bar type='bump' dataKey='duration' fill='#BEA4F6' />
            <XAxis dataKey='name' hide />
            <Tooltip
              cursor={false}
              content={<CustomTooltip renderIf={hasDurationPayload} formatter={formatDurationPayload} />}
            />
          </BarChart>
        </DashboardContainer>
      )}
      {(cacheHits > 0 || incrementalCacheHits < 0) && (
        <DashboardContainer
          title='Cache hit rate'
          range={recentUsage.length}
          callback={toggleDayRange}
          addBottomPadding>
          <PercentagePieChart percentage={cacheHits} />
        </DashboardContainer>
      )}
    </div>
  ) : null
}

const CustomTooltip = ({
  active,
  payload = [],
  label,
  formatter = payload => payload[0].value.toString(),
  renderIf = _ => true,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (payload: any[]) => string
  renderIf?: (payload: any[]) => boolean
}) =>
  active && payload && payload.length && renderIf(payload) ? (
    <div className='p-2 bg-white border border-gray-300 rounded'>
      <span>{`${label}: ${formatter(payload)}`}</span>
    </div>
  ) : null
