import { FormatCost, FormatDuration } from '@/src/common/formatting'
import { ActiveChain, ActivePrompt, IsProperRun, PartialRun, Run } from '@/types'
import { BorderedSection } from './runCellContinuation'
import durationIcon from '@/public/duration.svg'
import costIcon from '@/public/cost.svg'
import tokensIcon from '@/public/tokens.svg'
import Icon from '@/src/client/components/icon'
import { StaticImageData } from 'next/image'
import { AvailableLabelColorsForItem } from '@/src/client/labels/labelsPopup'
import ItemLabels from '@/src/client/labels/itemLabels'
import RunRatingButtons from './runRatingButtons'
import { ItemLabelsPopupMenu } from '@/src/client/labels/labelsPopupMenu'

export default function RunCellFooter({
  run,
  activeItem,
  isContinuation,
  isSelected,
  onRatingUpdate,
}: {
  run: PartialRun | Run
  activeItem?: ActivePrompt | ActiveChain
  isContinuation: boolean
  isSelected: boolean
  onRatingUpdate?: (run: Run) => Promise<void>
}) {
  return run.duration || run.cost ? (
    <BorderedSection border={isContinuation} bridgingGap>
      <div className='flex flex-col w-full gap-2 pt-2 border-t border-gray-200'>
        {IsProperRun(run) && run.labels.length > 0 && activeItem && (
          <ItemLabels labels={run.labels} colors={AvailableLabelColorsForItem(activeItem)} />
        )}
        <div className='flex items-center gap-3'>
          <RunAttributes run={run} />
          <div className='flex-1' />
          {IsProperRun(run) && activeItem && (
            <>
              <RunRatingButtons run={run} activeItem={activeItem} isSelected={isSelected} onUpdate={onRatingUpdate} />
              <div className='self-stretch border-r border-gray-200' />
              <ItemLabelsPopupMenu activeItem={activeItem} item={run} selectedCell />
            </>
          )}
        </div>
      </div>
    </BorderedSection>
  ) : null
}

const RunAttributes = ({ run }: { run: { duration?: number; cost?: number; tokens?: number } }) => {
  return (
    <>
      {!!run.duration && <Attribute icon={durationIcon} value={FormatDuration(run.duration)} />}
      {!!run.cost && <Attribute icon={costIcon} value={FormatCost(run.cost)} />}
      {!!run.tokens && <Attribute icon={tokensIcon} value={`${run.tokens} tokens`} />}
    </>
  )
}

const Attribute = ({ icon, value }: { icon: StaticImageData; value: string }) => (
  <div className='flex items-center'>
    <Icon icon={icon} />
    <div className='pt-0.5 text-xs text-gray-500 text-ellipsis whitespace-nowrap overflow-hidden'>{value}</div>
  </div>
)
