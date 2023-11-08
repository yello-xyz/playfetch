import { FormatCost, FormatDuration } from '@/src/common/formatting'
import { PartialRun, Run } from '@/types'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { BorderedSection } from './runCellContinuation'
import durationIcon from '@/public/duration.svg'
import costIcon from '@/public/cost.svg'
import dateIcon from '@/public/date.svg'
import Icon from '../icon'
import { StaticImageData } from 'next/image'

export default function RunCellFooter({ run, isContinuation }: { run: PartialRun | Run; isContinuation: boolean }) {
  const formattedDate = useFormattedDate(run.timestamp)

  return run.duration || run.cost || formattedDate ? (
    <BorderedSection border={isContinuation} bridgingGap>
      <div className='flex items-center gap-3'>
      {run.duration && <Attribute icon={durationIcon} value={FormatDuration(run.duration)} />}
      {run.cost && <Attribute icon={costIcon} value={FormatCost(run.cost)} />}
      {formattedDate && <Attribute icon={dateIcon} value={formattedDate} />}
      </div>
    </BorderedSection>
  ) : null
}

const Attribute = ({ icon, value }: { icon: StaticImageData; value: string }) => (
  <div className='flex items-center'>
    <Icon icon={icon} />
    <div className='pt-0.5 text-xs text-gray-500'>{value}</div>
  </div>
)
