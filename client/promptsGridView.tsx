import { Prompt } from '@/types'

export default function PromptsGridView({
  prompts = [],
  onSelect,
}: {
  prompts: Prompt[]
  onSelect: (promptID: number) => void
}) {
  const itemSize = 'min-w-[370px] min-h-[240px]'
  return (
    <div className='flex flex-wrap gap-6 p-6'>
      {prompts.map((prompt, promptIndex) => (
        <div
          className={`flex flex-col gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer ${itemSize}`}
          key={promptIndex}
          onClick={() => onSelect(prompt.id)}>
          <span className='text-sm font-medium'>{prompt.name}</span>
        </div>
      ))}
    </div>
  )
}
