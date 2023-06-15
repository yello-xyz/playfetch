import { Prompt } from '@/types'
import PendingButton from './pendingButton'

export default function PromptsGridView({
  prompts = [],
  onSelect,
}: {
  prompts: Prompt[]
  onSelect: (prompt: Prompt) => void
}) {
  return (
    <div className='flex flex-wrap gap-8 p-8'>
      {prompts.map((prompt, promptIndex) => (
        <PendingButton key={promptIndex} onClick={() => onSelect(prompt)}>
          {prompt.name}
        </PendingButton>
      ))}
    </div>
  )
}
