import { ActivePrompt, Prompt, Version } from '@/types'
import { useEffect, useState } from 'react'
import DropdownMenu from './dropdownMenu'
import api from '@/src/client/api'
import VersionSelector from './versionSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import Label from './label'

type ChainItem = { prompt: Prompt; version: undefined } | { prompt: ActivePrompt; version: Version }

export default function BuildChainTab({ prompts }: { prompts: Prompt[] }) {
  const [chain, setChain] = useState<ChainItem[]>([])

  const [promptCache, setPromptCache] = useState<{ [promptID: number]: ActivePrompt }>({})

  useEffect(() => {
    const promptID = chain.find(item => !item.version)?.prompt?.id
    if (promptID) {
      api.getPrompt(promptID).then(prompt => {
        setPromptCache({ ...promptCache, [promptID]: prompt })
        setChain(chain.map(item => (item.prompt.id === promptID ? { prompt, version: prompt.versions[0] } : item)))
      })
    }
  }, [chain])

  const chainItemFromPromptID = (promptID: number): ChainItem => {
    const cachedPrompt = promptCache[promptID]
    return cachedPrompt
      ? { prompt: cachedPrompt, version: cachedPrompt.versions[0] }
      : { prompt: prompts.find(prompt => prompt.id === promptID)!, version: undefined }
  }

  const addPrompt = (promptID: number) => {
    setChain([...chain, chainItemFromPromptID(promptID)])
  }

  const replacePrompt = (index: number) => (promptID: number) => {
    setChain([...chain.slice(0, index), chainItemFromPromptID(promptID), ...chain.slice(index + 1)])
  }

  const removePrompt = (index: number) => () => {
    setChain([...chain.slice(0, index), ...chain.slice(index + 1)])
  }

  const selectVersion = (index: number) => (version: Version) => {
    setChain([
      ...chain.slice(0, index),
      { prompt: chain[index].prompt as ActivePrompt, version },
      ...chain.slice(index + 1),
    ])
  }

  const allInputVariables = [... new Set(chain.flatMap(item => item.version ? ExtractPromptVariables(item.version.prompt) : []))]

  return (
    <>
      <div className='flex flex-col flex-grow h-full gap-4 p-6 max-w-[50%]'>
        <div className='flex flex-wrap gap-2'>
          <Label>Inputs:</Label>
          {allInputVariables.map((variable, index) => (
            <span key={index} className='text-white rounded px-1 py-0.5 bg-violet-500 font-normal'>{variable}</span>
          ))}
          </div>
        {chain.map((item, index) => (
          <div key={index} className='flex gap-4'>
            <PromptSelector
              prompts={prompts}
              selectedPrompt={item.prompt}
              onSelectPrompt={replacePrompt(index)}
              onRemovePrompt={removePrompt(index)}
            />
            {item.version && (
              <VersionSelector
                versions={item.prompt.versions}
                endpoints={item.prompt.endpoints}
                activeVersion={item.version}
                setActiveVersion={selectVersion(index)}
              />
            )}
          </div>
        ))}
        <PromptSelector
          key={chain.map(item => item.prompt.id).join('')}
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
