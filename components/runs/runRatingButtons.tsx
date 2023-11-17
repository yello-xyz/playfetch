import { ActivePrompt, Run, ActiveChain, RunRating } from '@/types'
import api from '@/src/client/api'
import thumbsUpIcon from '@/public/thumbsUp.svg'
import thumbsDownIcon from '@/public/thumbsDown.svg'
import thumbsUpFilledIcon from '@/public/thumbsUpFilled.svg'
import thumbsDownFilledIcon from '@/public/thumbsDownFilled.svg'
import { useRefreshActiveItem, useRefreshProject } from '@/src/client/context/refreshContext'
import IconButton from '../iconButton'

export default function RunRatingButtons({ run, activeItem }: { run: Run; activeItem: ActivePrompt | ActiveChain }) {
  const refreshProject = useRefreshProject()
  const refreshActiveItem = useRefreshActiveItem()
  const refresh = () => refreshActiveItem().then(refreshProject)

  const runComments = activeItem.versions
    .flatMap(version => version.comments)
    .filter(comment => comment.runID === run.id)

  const toggleRating = (rating: RunRating) => {
    if (rating !== run.rating) {
      const replyTo = runComments.findLast(
        comment => comment.action === (rating === 'positive' ? 'thumbsDown' : 'thumbsUp')
      )?.id
      api.toggleRunRating(run.id, activeItem.projectID, rating, replyTo).then(refresh)  
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <IconButton
        icon={run.rating === 'positive' ? thumbsUpFilledIcon : thumbsUpIcon}
        onClick={() => toggleRating('positive')}
        hoverType={{ background: 'hover:bg-blue-50' }}
      />
      <IconButton
        icon={run.rating === 'negative' ? thumbsDownFilledIcon : thumbsDownIcon}
        onClick={() => toggleRating('negative')}
        hoverType={{ background: 'hover:bg-blue-50' }}
      />
    </div>
  )
}
