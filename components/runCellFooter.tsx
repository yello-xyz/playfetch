import { FormatCost, FormatDate, FormatDuration } from '@/src/common/formatting'
import { PartialRun } from '@/types'
import { useEffect, useState } from 'react'

export default function RunCellFooter({ run }: { run: PartialRun }) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    if (run.timestamp) {
      setFormattedDate(FormatDate(run.timestamp))
    }
  }, [run.timestamp])

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

  return attributes.length > 0 ? <div className='self-end text-xs'>{attributes.join(' · ')}</div> : null
}
