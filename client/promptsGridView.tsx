import { FormatRelativeDate } from '@/common/formatting'
import { Prompt } from '@/types'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import api from './api'
import { useEffect, useState } from 'react'
import PromptPopupMenu from './promptPopupMenu'
import IconButton from './iconButton'
import { useRefreshProject, useSelectPrompt } from './refreshContext'

export default function PromptsGridView({ prompts, onAddPrompt }: { prompts: Prompt[]; onAddPrompt: () => void }) {
  return prompts.length ? (
    <>
      <div className='flex flex-wrap gap-6 p-6'>
        {prompts.map((prompt, index) => (
          <PromptCell key={index} prompt={prompt} />
        ))}
      </div>
    </>
  ) : (
    <EmptyGrid onAddPrompt={onAddPrompt} />
  )
}

function EmptyGrid({ onAddPrompt }: { onAddPrompt: () => void }) {
  const AddPromptLink = ({ label }: { label: string }) => (
    <span className='text-gray-500 underline cursor-pointer' onClick={onAddPrompt}>
      {label}
    </span>
  )

  return (
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 m-6 bg-gray-100 rounded-lg'>
      <span className='font-medium'>No Prompts</span>
      <span className='text-xs text-center text-gray-400 '>
        Create a <AddPromptLink label={'New Prompt'} /> to get started.
      </span>
    </div>
  )
}

function PromptCell({ prompt }: { prompt: Prompt }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const selectPrompt = useSelectPrompt()
  const refreshProject = useRefreshProject()

  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatRelativeDate(prompt.timestamp))
  }, [prompt.timestamp])

  return (
    <div
      className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer w-96 h-60`}
      onClick={() => selectPrompt(prompt.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 font-medium line-clamp-2'>{prompt.name}</span>
        <div className='relative flex'>
          <IconButton
            icon={prompt.favorited ? filledStarIcon.src : starIcon.src}
            onClick={() => api.toggleFavorite(prompt.id, !prompt.favorited).then(refreshProject)}
          />
          <IconButton icon={dotsIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
          {isMenuExpanded && (
            <div className='absolute right-0 top-7'>
              <PromptPopupMenu
                prompt={prompt}
                isMenuExpanded={isMenuExpanded}
                setIsMenuExpanded={setIsMenuExpanded}
                onRefresh={refreshProject}
              />
            </div>
          )}
        </div>
      </div>
      <span className='text-xs text-gray-500'>Edited {formattedDate}</span>
      <span className='mt-3 text-xs text-gray-500 line-clamp-[9]'>{prompt.prompt}</span>
    </div>
  )
}
