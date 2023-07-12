import { ActivePrompt, Prompt, Version } from '@/types'
import { ReactNode, useEffect, useState } from 'react'
import DropdownMenu from './dropdownMenu'
import api from '@/src/client/api'
import VersionSelector from './versionSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import Label from './label'
import { LoadedChainItem, ChainItem, IsLoadedChainItem } from './chainTabView'
import InputVariable from './inputVariable'

const ExtractChainVariables = (chain: ChainItem[]) => [
  ...new Set(chain.flatMap(item => (IsLoadedChainItem(item) ? ExtractPromptVariables(item.version.prompt) : []))),
]

export const ExtractUnboundChainVariables = (chain: ChainItem[]) => {
  const allInputVariables = ExtractChainVariables(chain)
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allInputVariables.filter(variable => !boundInputVariables.includes(variable))
}

const promptForItem = (item: ChainItem) => ('prompt' in item ? item.prompt : undefined)
const versionIDForItem = (item: ChainItem) => ('prompt' in item ? item.version?.id : item.versionID)
const keyForItem = (item: ChainItem) => ('prompt' in item ? item.prompt.id : item.versionID)

const loadPromptForItem = (item: ChainItem) =>
  'prompt' in item ? api.getPrompt(item.prompt.id) : api.getPromptForVersion(item.versionID)
const promptMatchesItem = (prompt: ActivePrompt, item: ChainItem) =>
  'prompt' in item ? item.prompt.id === prompt.id : prompt.versions.some(version => version.id === item.versionID)

const selectPromptVersion = (prompt: ActivePrompt, versionID?: number) =>
  (versionID ? prompt.versions.find(version => version.id === versionID) : undefined) ?? prompt.versions.slice(-1)[0]

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
    const loadChainItem = (prompt: ActivePrompt) => (item: ChainItem) =>
      promptMatchesItem(prompt, item)
        ? { prompt, version: selectPromptVersion(prompt, versionIDForItem(item)), output: item.output }
        : item

    const unloadedItem = chain.find(item => !IsLoadedChainItem(item))
    if (unloadedItem) {
      loadPromptForItem(unloadedItem).then(prompt => {
        setPromptCache(promptCache => ({ ...promptCache, [prompt.id]: prompt }))
        setChain(chain.map(loadChainItem(prompt)))
      })
    }
  }, [chain, setChain])

  const chainItemFromPromptID = (promptID: number): ChainItem => {
    const cachedPrompt = promptCache[promptID]
    return cachedPrompt
      ? { prompt: cachedPrompt, version: cachedPrompt.versions.slice(-1)[0] }
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

  const selectVersion = (index: number) => (version: Version) => {
    setChain([...chain.slice(0, index), { ...(chain[index] as LoadedChainItem), version }, ...chain.slice(index + 1)])
  }

  const mapOutput = (index: number) => (output?: string) => {
    const resetChain = chain.map(item =>
      IsLoadedChainItem(item) ? { ...item, output: item.output === output ? undefined : item.output } : item
    )
    setChain([
      ...resetChain.slice(0, index),
      { ...(resetChain[index] as LoadedChainItem), output },
      ...resetChain.slice(index + 1),
    ])
  }

  return (
    <>
      <div className='flex flex-col flex-grow h-full gap-4 p-6'>
        <div className='flex flex-wrap gap-2'>
          <Label>Inputs:</Label>
          {ExtractUnboundChainVariables(chain).map((variable, index) => (
            <InputVariable key={index}>{variable}</InputVariable>
          ))}
        </div>
        {chain.map((item, index) => (
          <div key={index} className='flex gap-4'>
            <PromptSelector
              prompts={prompts}
              selectedPrompt={promptForItem(item)}
              onSelectPrompt={replacePrompt(index)}
              onRemovePrompt={removePrompt(index)}
            />
            {IsLoadedChainItem(item) && (
              <Selector>
                <VersionSelector
                  versions={promptCache[item.prompt.id].versions}
                  endpoints={promptCache[item.prompt.id].endpoints}
                  activeVersion={item.version}
                  setActiveVersion={selectVersion(index)}
                />
              </Selector>
            )}
            {IsLoadedChainItem(item) && (
              <OutputMapper
                key={item.output}
                output={item.output}
                inputs={ExtractChainVariables(chain.slice(index + 1))}
                onMapOutput={mapOutput(index)}
              />
            )}
          </div>
        ))}
        <PromptSelector
          key={chain.map(item => keyForItem(item)).join('')}
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
  return inputs.length ? (
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
  ) : null
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
