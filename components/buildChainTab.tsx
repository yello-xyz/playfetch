import { Prompt } from '@/types'
import { useState } from 'react'
import DropdownMenu from './dropdownMenu'

export default function BuildChainTab({ prompts }: { prompts: Prompt[] }) {
  const [chain, setChain] = useState<Prompt[]>([])

  const promptFromID = (promptID: number) => prompts.find(prompt => prompt.id === promptID)!

  const addPrompt = (promptID: number) => {
    setChain([...chain, promptFromID(promptID)])
  }

  const replacePrompt = (index: number) => (promptID: number) => {
    setChain([...chain.slice(0, index), promptFromID(promptID), ...chain.slice(index + 1)])
  }

  const removePrompt = (index: number) => () => {
    setChain([...chain.slice(0, index), ...chain.slice(index + 1)])
  }

  return (
    <>
      <div className='flex flex-col flex-grow h-full gap-4 p-6 max-w-[50%]'>
        {chain.map((prompt, index) => (
          <PromptSelector
            key={index}
            prompts={prompts}
            selectedPrompt={prompt}
            onSelectPrompt={replacePrompt(index)}
            onRemovePrompt={removePrompt(index)}
          />
        ))}
        <PromptSelector
          key={chain.map(prompt => prompt.id).join('')}
          prompts={prompts}
          onSelectPrompt={addPrompt}
          includeAddPromptOption
        />
      </div>
    </>
  )
}

function PromptSelector({
  prompts,
  selectedPrompt,
  onSelectPrompt,
  includeAddPromptOption,
  onRemovePrompt,
}: {
  prompts: Prompt[]
  selectedPrompt?: Prompt
  onSelectPrompt: (promptID: number) => void
  includeAddPromptOption?: boolean
  onRemovePrompt?: () => void
}) {
  return (
    <DropdownMenu
      value={selectedPrompt?.id}
      onChange={value => (onRemovePrompt && !Number(value) ? onRemovePrompt() : onSelectPrompt(Number(value)))}>
      {includeAddPromptOption && <option value={0}>Add Prompt to Chain</option>}
      {prompts.map((prompt, index) => (
        <option key={index} value={prompt.id}>
          {prompt.name}
        </option>
      ))}
      {onRemovePrompt && <option disabled>────────────────────────────────────</option>}
      {onRemovePrompt && <option value={0}>Remove Prompt from Chain</option>}
    </DropdownMenu>
  )
}
