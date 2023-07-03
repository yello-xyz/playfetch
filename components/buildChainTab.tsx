import { Prompt } from '@/types'
import { useState } from 'react'
import DropdownMenu from './dropdownMenu'

export default function BuildChainTab({ prompts }: { prompts: Prompt[] }) {
  const [chain, setChain] = useState<Prompt[]>([])

  return (
    <>
      <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 max-w-[50%]'>
        <DropdownMenu
          value={undefined}
          onChange={value => setChain([...chain, prompts.find(prompt => prompt.id === Number(value))!])}>
          {prompts.map((prompt, index) => (
            <option key={index} value={prompt.id}>
              {prompt.name}
            </option>
          ))}
        </DropdownMenu>
      </div>
    </>
  )
}
