import { Truncate } from '@/common/formatting'
import { Prompt } from '@/types'

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
          className={`flex flex-col gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer w-96 h-60`}
          key={promptIndex}
          onClick={() => onSelect(prompt.id)}>
          <span className='text-sm font-medium'>{prompt.name}</span>
          <span className='text-xs text-gray-500'>{Truncate(prompt.prompt, 500)}</span>
        </div>
      ))}
    </div>
  )
}
