import { ActivePrompt, Run, ActiveChain, RunRating } from '@/types'
import api from '@/src/client/api'
import thumbsUpIcon from '@/public/thumbsUp.svg'
import thumbsDownIcon from '@/public/thumbsDown.svg'
import thumbsUpFilledIcon from '@/public/thumbsUpFilled.svg'
import thumbsDownFilledIcon from '@/public/thumbsDownFilled.svg'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/projectContext'
import IconButton from '../iconButton'
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
}: {
  run: Run
  activeItem: ActivePrompt | ActiveChain
  isSelected: boolean
}) {
  const refreshProject = useRefreshProject()
  const refreshActiveItem = useRefreshActiveItem()
  const refresh = () => refreshActiveItem().then(refreshProject)

  const runComments = activeItem.versions
    .flatMap(version => version.comments)
    .filter(comment => comment.runID === run.id)

  const [pendingRating, setPendingRating] = useState<RunRating>()

  const toggleRating = (rating: RunRating, reason?: string) => {
    if ((!!reason || rating !== run.rating) && rating !== pendingRating) {
      setPendingRating(rating)
      const replyToActions = reason ? ['thumbsDown', 'thumbsUp'] : rating === 'positive' ? ['thumbsDown'] : ['thumbsUp']
      const replyTo = runComments.findLast(comment => !!comment.action && replyToActions.includes(comment.action))?.id
      api
        .toggleRunRating(run.id, activeItem.projectID, rating, reason, replyTo)
        .then(refresh)
        .then(() => setPendingRating(undefined))
    }
  }

  const showReasonPopup = (rating: RunRating) => (): [typeof ReasonPopup, ReasonPopupProps] =>
    [ReasonPopup, { rating, callback: reason => toggleRating(rating, reason) }]

  const rating = pendingRating ?? run.rating

  return (
    <div className='flex items-center gap-2'>
      <GlobalPopupMenu
        icon={rating === 'positive' ? thumbsUpFilledIcon : thumbsUpIcon}
        loadPopup={showReasonPopup('positive')}
        selectedCell={isSelected}
        popUpAbove
      />
      <GlobalPopupMenu
        icon={rating === 'negative' ? thumbsDownFilledIcon : thumbsDownIcon}
        loadPopup={showReasonPopup('negative')}
        selectedCell={isSelected}
        popUpAbove
      />
    </div>
  )
}

export type ReasonPopupProps = {
  rating: RunRating
  callback: (reason?: string) => void
}

export function ReasonPopup({ rating, callback, withDismiss }: ReasonPopupProps & WithDismiss) {
  const [reason, setReason] = useState('')

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
