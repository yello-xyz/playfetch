import { FormatCost, FormatDuration } from '@/src/common/formatting'
import { PartialRun } from '@/types'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'

export default function RunCellFooter({ run }: { run: PartialRun }) {
  const formattedDate = useFormattedDate(run.timestamp)

  const attributes = [] as string[]
  if (run.duration) {
    attributes.push(FormatDuration(run.duration))
  }
  if (run.cost) {
    attributes.push(FormatCost(run.cost))
  }
  if (formattedDate) {
    attributes.push(formattedDate)
  }

  return attributes.length > 0 ? <div className='self-end text-xs text-gray-500'>{attributes.join(' · ')}</div> : null
}
