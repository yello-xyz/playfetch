import { ActivePrompt, Run, ActiveChain, RunRating } from '@/types'
import api from '@/src/client/api'
import thumbsUpIcon from '@/public/thumbsUp.svg'
import thumbsDownIcon from '@/public/thumbsDown.svg'
import thumbsUpFilledIcon from '@/public/thumbsUpFilled.svg'
import thumbsDownFilledIcon from '@/public/thumbsDownFilled.svg'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/projectContext'
import { KeyboardEvent, useCallback, useState } from 'react'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../popupMenu'
import TextInput from '../textInput'
import Button from '../button'
import GlobalPopupMenu from '../globalPopupMenu'

export default function RunRatingButtons({
  run,
  activeItem,
  isSelected,
  onUpdate,
}: {
  run: Run
  activeItem: ActivePrompt | ActiveChain
  isSelected: boolean
  onUpdate?: (run: Run) => Promise<void>
}) {
  const refreshProject = useRefreshProject()
  const refreshActiveItem = useRefreshActiveItem()
  const refresh = async () => {
    await refreshActiveItem()
    if (onUpdate) {
      await onUpdate(run)
    }
    refreshProject()
  }

  const runComments = activeItem.versions
    .flatMap(version => version.comments)
    .filter(comment => comment.runID === run.id)

  const [pendingRating, setPendingRating] = useState<RunRating>()

  const toggleRating = (rating: RunRating, reason?: string) => {
    if ((!!reason || rating !== run.rating || run.isPredictedRating) && rating !== pendingRating) {
      setPendingRating(rating)
      const replyToActions = reason ? ['thumbsDown', 'thumbsUp'] : rating === 'positive' ? ['thumbsDown'] : ['thumbsUp']
      const replyTo = runComments.findLast(comment => !!comment.action && replyToActions.includes(comment.action))?.id
      api
        .toggleRunRating(run.id, activeItem.projectID, rating, reason, replyTo)
        .then(refresh)
        .then(() => setPendingRating(undefined))
    }
  }

  const ratingButtonProps = { run, pendingRating, setRating: toggleRating, isSelected }

  return (
    <div className='flex items-center gap-2'>
      <RatingButton rating='positive' {...ratingButtonProps} />
      <RatingButton rating='negative' {...ratingButtonProps} />
    </div>
  )
}

function RatingButton({
  run,
  rating,
  pendingRating,
  setRating,
  isSelected,
}: {
  run: Run
  rating: RunRating
  pendingRating: RunRating | undefined
  setRating: (rating: RunRating, reason?: string) => void
  isSelected: boolean
}) {
  const showReasonPopup = (rating: RunRating) => (): [typeof ReasonPopup, ReasonPopupProps] =>
    [
      ReasonPopup,
      {
        rating,
        callback: reason => setRating(rating, reason),
        predictedReason: run.isPredictedRating && run.rating === rating && !!run.reason ? run.reason : undefined,
      },
    ]

  const isActiveRating = (pendingRating ?? run.rating) === rating

  const iconForRating = () => {
    switch (rating) {
      case 'positive':
        return isActiveRating ? thumbsUpFilledIcon : thumbsUpIcon
      case 'negative':
        return isActiveRating ? thumbsDownFilledIcon : thumbsDownIcon
    }
  }

  return (
    <div className='relative overflow-visible group'>
      <div className={isActiveRating && run.isPredictedRating && !pendingRating ? 'opacity-50' : ''}>
        <GlobalPopupMenu
          icon={iconForRating()}
          loadPopup={showReasonPopup(rating)}
          selectedCell={isSelected}
          popUpAbove
        />
      </div>
      {run.reason && isActiveRating && !pendingRating && (
        <div className='absolute hidden overflow-visible group-hover:block left-3 bottom-8 max-w-0'>
          <div className='flex justify-center'>
            <div className={`min-w-[160px] flex justify-center ${run.isPredictedRating ? 'italic' : ''}`}>
              <span className='py-1 px-2 text-xs text-center bg-white border border-gray-200 rounded-md max-w-[160px]'>
                {run.reason}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type ReasonPopupProps = {
  rating: RunRating
  callback: (reason?: string) => void
  predictedReason?: string
}

function ReasonPopup({ rating, callback, predictedReason, withDismiss }: ReasonPopupProps & WithDismiss) {
  const [reason, setReason] = useState(predictedReason ?? '')

  const confirm = withDismiss(() => callback(reason ?? undefined))

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      confirm()
    } else if (event.key === 'Escape') {
      withDismiss(() => {})()
    }
  }

  const onLoad = useCallback((node: HTMLInputElement | null) => node?.focus(), [])

  return (
    <PopupContent>
      <div className='flex flex-col gap-2 p-3 w-80'>
        <span className='font-bold text-gray-800'>
          What do you {rating === 'positive' ? 'like' : 'dislike'} about this response?
        </span>
        <TextInput onLoad={onLoad} onKeyDown={onKeyDown} value={reason} setValue={setReason} />
        <div className='self-end'>
          <Button type='primary' onClick={confirm}>
            Done
          </Button>
        </div>
      </div>
    </PopupContent>
  )
}
