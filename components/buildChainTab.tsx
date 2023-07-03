import { ActivePrompt, Prompt, Version } from '@/types'
import { ReactNode, useEffect, useState } from 'react'
import DropdownMenu from './dropdownMenu'
import api from '@/src/client/api'
import VersionSelector from './versionSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import Label from './label'
import { ChainItem } from './chainTabView'

export default function BuildChainTab({
  chain,
  setChain,
  prompts,
}: {
  prompts: Prompt[]
  chain: ChainItem[]
  setChain: (chain: ChainItem[]) => void
}) {
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
      : { prompt: prompts.find(prompt => prompt.id === promptID)!, version: undefined, output: undefined }
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

  const asLoaded = (item: ChainItem) => item as { prompt: ActivePrompt; version: Version; output?: string }

  const selectVersion = (index: number) => (version: Version) => {
    setChain([...chain.slice(0, index), { ...asLoaded(chain[index]), version }, ...chain.slice(index + 1)])
  }

  const mapOutput = (index: number) => (output?: string) => {
    const resetChain = chain.map(item =>
      item.version ? { ...item, output: item.output === output ? undefined : item.output } : item
    )
    setChain([
      ...resetChain.slice(0, index),
      { ...asLoaded(resetChain[index]), output },
      ...resetChain.slice(index + 1),
    ])
  }

  const variablesFromItem = (item: ChainItem) => (item.version ? ExtractPromptVariables(item.version.prompt) : [])
  const variablesFromSlice = (slice: ChainItem[]) => [...new Set(slice.flatMap(variablesFromItem))]
  const variablesFromIndex = (index: number) => variablesFromSlice(chain.slice(index + 1))
  const allInputVariables = variablesFromSlice(chain)
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  const unboundInputVariables = allInputVariables.filter(variable => !boundInputVariables.includes(variable))

  return (
    <>
      <div className='flex flex-col flex-grow h-full gap-4 p-6'>
        <div className='flex flex-wrap gap-2'>
          <Label>Inputs:</Label>
          {unboundInputVariables.map((variable, index) => (
            <span key={index} className='text-white rounded px-1 py-0.5 bg-violet-500 font-normal'>
              {variable}
            </span>
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
              <Selector>
                <VersionSelector
                  versions={item.prompt.versions}
                  endpoints={item.prompt.endpoints}
                  activeVersion={item.version}
                  setActiveVersion={selectVersion(index)}
                />
              </Selector>
            )}
            {item.version && variablesFromIndex(index).length > 0 && (
              <OutputMapper
                key={item.output}
                output={item.output}
                inputs={variablesFromIndex(index)}
                onMapOutput={mapOutput(index)}
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

function Selector({ children }: { children: ReactNode }) {
  return <div className='w-full max-w-[30%]'>{children}</div>
}

function OutputMapper({
  output,
  inputs,
  onMapOutput,
}: {
  output?: string
  inputs: string[]
  onMapOutput: (input?: string) => void
}) {
  return (
    <Selector>
      <DropdownMenu value={output ?? 0} onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}>
        <option value={0}>Map Output</option>
        {inputs.map((input, index) => (
          <option key={index} value={input}>
            {input}
          </option>
        ))}
      </DropdownMenu>
    </Selector>
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
    <Selector>
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
    </Selector>
  )
}
