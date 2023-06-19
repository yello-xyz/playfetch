import { FormatRelativeDate, Truncate } from '@/common/formatting'
import { Prompt } from '@/types'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import api from './api'
import { useState } from 'react'
import PopupMenu, { PopupMenuItem } from './popupMenu'

export default function PromptsGridView({
  prompts = [],
  onSelect,
  onRefresh,
}: {
  prompts: Prompt[]
  onSelect: (promptID: number) => void
  onRefresh: () => void
}) {
  return (
    <div className='flex flex-wrap gap-6 p-6'>
      {prompts.map((prompt, index) => (
        <PromptCell prompt={prompt} index={index} onSelect={onSelect} onRefresh={onRefresh} />
      ))}
    </div>
  )
}

function PromptCell({
  prompt,
  index,
  onSelect,
  onRefresh,
}: {
  prompt: Prompt
  index: number
  onSelect: (promptID: number) => void
  onRefresh: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  return (
    <div
      className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer w-96 h-60`}
      key={index}
      onClick={() => onSelect(prompt.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 text-sm font-medium line-clamp-2'>{prompt.name}</span>
        <div className='relative flex'>
          <IconButton
            icon={prompt.favorited ? filledStarIcon.src : starIcon.src}
            onClick={() => api.toggleFavorite(prompt.id, !prompt.favorited).then(onRefresh)}
          />
          <IconButton icon={dotsIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
          {isMenuExpanded && (
            <div className='absolute right-0 top-7'>
              <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
                <PopupMenuItem destructive title='Delete' callback={() => {}} />
              </PopupMenu>
            </div>
          )}
        </div>
      </div>
      <span className='text-xs text-gray-500'>Edited {FormatRelativeDate(prompt.timestamp)}</span>
      <span className='mt-3 text-xs text-gray-500 line-clamp-[9]'>{prompt.prompt}</span>
    </div>
  )
}

const IconButton = ({ icon, onClick }: { icon: string; onClick: () => void }) => (
  <img
    className='w-6 h-6 rounded cursor-pointer hover:bg-gray-100'
    src={icon}
    onClick={event => {
      event.stopPropagation()
      onClick()
    }}
  />
)
