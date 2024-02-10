import { ResolvedEndpoint } from '@/types'
import Label from '@/src/client/components/label'
import { FormatCost, FormatDuration } from '@/src/common/formatting'

export default function UsagePane({ endpoint }: { endpoint: ResolvedEndpoint }) {
  const usage = endpoint.usage
  const averageCost = usage.requests ? usage.cost / usage.requests : 0
  const averageDuration = usage.requests ? usage.duration / usage.requests : 0
  const averageAttempts = usage.requests ? usage.attempts / usage.requests : 0
  const cacheHitRatio = usage.requests ? usage.cacheHits / usage.requests : 0

  const averageAggregatedCost =
    usage.continuations > 0 && usage.continuations < usage.requests
      ? usage.cost / (usage.requests - usage.continuations)
      : averageCost

  return (
    <>
      <Label className='-mb-4'>Usage</Label>
      <div className='flex flex-col w-full gap-4 p-4 py-4 bg-white border border-gray-200 rounded-lg'>
        <UsageRow label='Requests' value={usage.requests} />
        <UsageRow label='Failed Requests' value={usage.failures} />
        <UsageRow label='Total Cost' value={FormatCost(usage.cost)} />
        <UsageRow label='Average Cost' value={FormatCost(averageCost)} />
        {averageAggregatedCost !== averageCost && (
          <UsageRow label='Average Aggregated Cost' value={FormatCost(averageAggregatedCost)} />
        )}
        <UsageRow label='Average Duration' value={FormatDuration(averageDuration)} />
        <UsageRow label='Average Attempts' value={averageAttempts ? averageAttempts.toFixed(2) : averageAttempts} />
        <UsageRow label='Cache Hit Ratio' value={`${(100 * cacheHitRatio).toFixed(1)}%`} />
      </div>
    </>
  )
}

function UsageRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className='flex items-center justify-between gap-8'>
      <Label className='w-60'>{label}</Label>
      {value}
    </div>
  )
}
