import { FormatCost, FormatDuration } from '@/src/common/formatting'
import { ActiveChain, ActivePrompt, PartialRun, Run } from '@/types'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { BorderedSection } from './runCellContinuation'
import durationIcon from '@/public/duration.svg'
import costIcon from '@/public/cost.svg'
import dateIcon from '@/public/date.svg'
import Icon from '../icon'
import { StaticImageData } from 'next/image'
import LabelPopupMenu, { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { ItemLabels } from '../versions/versionLabels'
import RunRatingButtons from './runRatingButtons'

export default function RunCellFooter({
  run,
  activeItem,
  isContinuation,
}: {
  run: PartialRun | Run
  activeItem?: ActivePrompt | ActiveChain
  isContinuation: boolean
}) {
  const isProperRun = ((item): item is Run => 'labels' in item)(run)
  const formattedDate = useFormattedDate(run.timestamp)

  return run.duration || run.cost || formattedDate ? (
    <BorderedSection border={isContinuation} bridgingGap>
      <div className='flex flex-col w-full gap-2 pt-2 border-t border-gray-200'>
        {isProperRun && run.labels.length > 0 && activeItem && (
          <ItemLabels labels={run.labels} colors={AvailableLabelColorsForItem(activeItem)} />
        )}
        <div className='flex items-center gap-3'>
          {!!run.duration && <Attribute icon={durationIcon} value={FormatDuration(run.duration)} />}
          {!!run.cost && <Attribute icon={costIcon} value={FormatCost(run.cost)} />}
          {formattedDate && <Attribute icon={dateIcon} value={formattedDate} />}
          <div className='flex-1' />
          {isProperRun && activeItem && (
            <>
              <RunRatingButtons run={run} activeItem={activeItem} />
              <div className='self-stretch border-r border-gray-200' />
              <LabelPopupMenu activeItem={activeItem} item={run} selectedCell />
            </>
          )}
        </div>
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
