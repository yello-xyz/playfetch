import { FormatRelativeDate, Truncate } from '@/common/formatting'
import { Prompt } from '@/types'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'

export default function PromptsGridView({
  prompts = [],
  onSelect,
}: {
  prompts: Prompt[]
  onSelect: (promptID: number) => void
}) {
  return (
    <div className='flex flex-wrap gap-6 p-6'>
      {prompts.map((prompt, promptIndex) => (
        <div
          className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer w-96 h-60`}
          key={promptIndex}
          onClick={() => onSelect(prompt.id)}>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>{prompt.name}</span>
            <IconButton icon={prompt.favorited ? filledStarIcon.src : starIcon.src} onClick={() => {}} />
          </div>
          <span className='text-xs text-gray-500'>Edited {FormatRelativeDate(prompt.timestamp)}</span>
          <span className='mt-3 text-xs text-gray-500'>{Truncate(prompt.prompt, 500)}</span>
        </div>
      ))}
    </div>
  )
}

const IconButton = ({ icon, onClick }: { icon: string; onClick: () => void }) => (
  <img className='w-6 h-6 rounded cursor-pointer hover:bg-gray-100' src={icon} onClick={onClick} />
)
