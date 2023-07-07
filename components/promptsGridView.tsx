import { FormatRelativeDate } from '@/src/common/formatting'
import { Project, Prompt } from '@/types'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import api from '../src/client/api'
import { useEffect, useState } from 'react'
import PromptPopupMenu from './promptPopupMenu'
import IconButton from './iconButton'
import { useRefreshProject } from './refreshContext'

export default function PromptsGridView({
  prompts,
  projects,
  onAddPrompt,
  onSelectPrompt,
}: {
  prompts: Prompt[]
  projects: Project[]
  onAddPrompt: () => void
  onSelectPrompt: (promptID: number) => void
}) {
  return prompts.length ? (
    <div className='flex flex-wrap content-start h-full gap-6 p-6 overflow-y-auto'>
      {prompts.map((prompt, index) => (
        <PromptCell key={index} prompt={prompt} projects={projects} onSelectPrompt={onSelectPrompt} />
      ))}
    </div>
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
    <div className='h-full p-6'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
        <span className='font-medium'>No Prompts</span>
        <span className='text-xs text-center text-gray-400 '>
          Create a <AddPromptLink label={'New Prompt'} /> to get started.
        </span>
      </div>
    </div>
  )
}

function PromptCell({
  prompt,
  projects,
  onSelectPrompt,
}: {
  prompt: Prompt
  projects: Project[]
  onSelectPrompt: (promptID: number) => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshProject = useRefreshProject()

  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatRelativeDate(prompt.timestamp))
  }, [prompt.timestamp])

  return (
    <div
      className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer w-96 h-60`}
      onClick={() => onSelectPrompt(prompt.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 font-medium line-clamp-2'>{prompt.name}</span>
        <div className='relative flex'>
          <IconButton
            icon={prompt.favorited ? filledStarIcon : starIcon}
            onClick={() => api.toggleFavorite(prompt.id, !prompt.favorited).then(refreshProject)}
          />
          <IconButton icon={dotsIcon} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
          <div className='absolute right-0 top-7'>
            <PromptPopupMenu
              prompt={prompt}
              projects={projects}
              isMenuExpanded={isMenuExpanded}
              setIsMenuExpanded={setIsMenuExpanded}
              onRefresh={refreshProject}
            />
          </div>
        </div>
      </div>
      <span className='text-xs text-gray-500'>Edited {formattedDate}</span>
      <span className='mt-3 text-xs text-gray-500 line-clamp-[9]'>{prompt.prompt}</span>
    </div>
  )
}
