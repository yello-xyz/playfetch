import { ResolvedEndpoint } from '@/types'
import Label from './label'
import { FormatCost, FormatDuration } from '@/src/common/formatting'
import Button from './button'
import api from '@/src/client/api'
import useModalDialogPrompt from './modalDialogContext'

export default function UsagePane({ endpoint, onRefresh }: { endpoint: ResolvedEndpoint; onRefresh: () => void }) {
  const usage = endpoint.usage
  const averageCost = usage.requests ? usage.cost / usage.requests : 0
  const averageDuration = usage.requests ? usage.duration / usage.requests : 0
  const averageAttempts = usage.requests ? usage.attempts / usage.requests : 0
  const cacheHitRatio = usage.requests ? usage.cacheHits / usage.requests : 0

  const setDialogPrompt = useModalDialogPrompt()

  const deleteEndpoint = () => {
    setDialogPrompt({
      title:
        'Are you sure you want to delete this endpoint? ' +
        `You will no longer be able to access ${endpoint.enabled ? 'the API or ' : ''}usage data.`,
      callback: () => api.deleteEndpoint(endpoint.id).then(onRefresh),
      destructive: true,
    })
  }

  return (
    <>
      <Label>Usage</Label>
      <div className='flex flex-col w-full gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
        <UsageRow label='Requests' value={usage.requests} />
        <UsageRow label='Failed Requests' value={usage.failures} />
        <UsageRow label='Total Cost' value={FormatCost(usage.cost)} />
        <UsageRow label='Average Cost' value={FormatCost(averageCost)} />
        <UsageRow label='Average Duration' value={FormatDuration(averageDuration)} />
        <UsageRow label='Average Attempts' value={averageAttempts ? averageAttempts.toFixed(2) : averageAttempts} />
        <UsageRow label='Cache Hit Ratio' value={`${(100 * cacheHitRatio).toFixed(1)}%`} />
      </div>
      <Label>Danger zone</Label>
      <Button type='destructive' onClick={deleteEndpoint}>
        Delete Endpoint
      </Button>
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
