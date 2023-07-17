import { FormatRelativeDate } from '@/src/common/formatting'
import { Chain, Project, Prompt } from '@/types'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import api from '../src/client/api'
import { useEffect, useState } from 'react'
import IconButton from './iconButton'
import { useRefreshProject } from './refreshContext'
import ProjectItemPopupMenu from './projectItemPopupMenu'

export default function ProjectGridView({
  items,
  projects,
  onSelectItem,
}: {
  items: (Prompt | Chain)[]
  projects: Project[]
  onSelectItem: (itemID: number) => void
}) {
  return (
    <div className='flex flex-wrap content-start h-full gap-6 p-6 overflow-y-auto'>
      {items.map((item, index) => (
        <ProjectItemCell key={index} item={item} projects={projects} onSelectItem={onSelectItem} />
      ))}
    </div>
  )
}

export function EmptyGridView({ title, label, onAddItem }: { title: string; label: string; onAddItem: () => void }) {
  const AddItemLink = ({ label }: { label: string }) => (
    <span className='text-gray-500 underline cursor-pointer' onClick={onAddItem}>
      {label}
    </span>
  )

  return (
    <div className='h-full p-6'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
        <span className='font-medium'>{title}</span>
        <span className='text-xs text-center text-gray-400 '>
          Create a <AddItemLink label={label} /> to get started.
        </span>
      </div>
    </div>
  )
}

function ProjectItemCell({
  item,
  projects,
  onSelectItem,
}: {
  item: Prompt | Chain
  projects: Project[]
  onSelectItem: (itemID: number) => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshProject = useRefreshProject()

  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatRelativeDate(item.timestamp))
  }, [item.timestamp])

  const isPrompt = 'prompt' in item
  const toggleFavorite = (id: number, favorited: boolean) =>
    isPrompt ? api.toggleFavoritePrompt(id, favorited) : api.toggleFavoriteChain(id, favorited)

  return (
    <div
      className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer w-96 h-60`}
      onClick={() => onSelectItem(item.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 font-medium line-clamp-2'>{item.name}</span>
        <div className='relative flex'>
          <IconButton
            icon={item.favorited ? filledStarIcon : starIcon}
            onClick={() => toggleFavorite(item.id, !item.favorited).then(refreshProject)}
          />
          <IconButton icon={dotsIcon} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
          <div className='absolute right-0 top-7'>
            <ProjectItemPopupMenu
              item={item}
              projects={projects}
              isMenuExpanded={isMenuExpanded}
              setIsMenuExpanded={setIsMenuExpanded}
              onRefresh={refreshProject}
            />
          </div>
        </div>
      </div>
      <span className='text-xs text-gray-500'>Edited {formattedDate}</span>
      {'prompt' in item && <span className='mt-3 text-xs text-gray-500 line-clamp-[9]'>{item.prompt}</span>}
    </div>
  )
}
