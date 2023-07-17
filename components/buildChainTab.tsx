import { ActivePrompt, ChainItem, Prompt, Version } from '@/types'
import { ReactNode, useEffect, useState } from 'react'
import DropdownMenu from './dropdownMenu'
import api from '@/src/client/api'
import VersionSelector from './versionSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import Label from './label'
import { LoadedChainItem, IsLoadedChainItem } from './chainTabView'
import InputVariable from './inputVariable'
import Checkbox from './checkbox'

const ExtractChainVariables = (chain: ChainItem[]) => [
  ...new Set(chain.flatMap(item => (IsLoadedChainItem(item) ? ExtractPromptVariables(item.version.prompt) : []))),
]

export const ExtractUnboundChainVariables = (chain: ChainItem[]) => {
  const allInputVariables = ExtractChainVariables(chain)
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allInputVariables.filter(variable => !boundInputVariables.includes(variable))
}

export default function BuildChainTab({
  items,
  setItems,
  prompts,
}: {
  prompts: Prompt[]
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
}) {
  const [promptCache, setPromptCache] = useState<{ [promptID: number]: ActivePrompt }>({})

  useEffect(() => {
    const unloadedItem = items.find(item => !IsLoadedChainItem(item))
    if (unloadedItem) {
      api.getPrompt(unloadedItem.promptID).then(prompt => {
        setPromptCache(promptCache => ({ ...promptCache, [prompt.id]: prompt }))
        setItems(
          items.map(item =>
            item.promptID === prompt.id
              ? {
                  ...item,
                  prompt,
                  version: prompt.versions.find(version => version.id === item.versionID),
                }
              : item
          )
        )
      })
    }
  }, [items, setItems])

  const chainItemFromPromptID = (promptID: number): ChainItem => {
    const prompt = prompts.find(prompt => prompt.id === promptID)!
    const versionID = prompt.lastVersionID
    const cachedPrompt = promptCache[promptID]
    return { promptID, versionID, ...(cachedPrompt ? { version: cachedPrompt.versions.slice(-1)[0] } : {}) }
  }

  const addPrompt = (promptID: number) => setItems([...items, chainItemFromPromptID(promptID)])

  const replacePrompt = (index: number) => (promptID: number) =>
    setItems([...items.slice(0, index), chainItemFromPromptID(promptID), ...items.slice(index + 1)])

  const removePrompt = (index: number) => () => setItems([...items.slice(0, index), ...items.slice(index + 1)])

  const toggleIncludeContext = (index: number) => (includeContext: boolean) =>
    setItems([...items.slice(0, index), { ...items[index], includeContext }, ...items.slice(index + 1)])

  const selectVersion = (index: number) => (version: Version) =>
    setItems([
      ...items.slice(0, index),
      { ...items[index], versionID: version.id, version } as LoadedChainItem,
      ...items.slice(index + 1),
    ])

  const mapOutput = (index: number) => (output?: string) => {
    const resetChain = items.map(item =>
      IsLoadedChainItem(item) ? { ...item, output: item.output === output ? undefined : item.output } : item
    )
    setItems([
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
          {ExtractUnboundChainVariables(items).map((variable, index) => (
            <InputVariable key={index}>{variable}</InputVariable>
          ))}
        </div>
        {items.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <Checkbox disabled={index === 0} checked={!!item.includeContext} setChecked={toggleIncludeContext(index)} />
            <PromptSelector
              prompts={prompts}
              selectedPrompt={prompts.find(prompt => prompt.id === item.promptID)}
              onSelectPrompt={replacePrompt(index)}
              onRemovePrompt={removePrompt(index)}
            />
            {IsLoadedChainItem(item) && (
              <Selector>
                <VersionSelector
                  versions={item.prompt.versions}
                  endpoints={item.prompt.endpoints}
                  activeVersion={item.version}
                  setActiveVersion={selectVersion(index)}
                />
              </Selector>
            )}
            <OutputMapper
              key={item.output}
              output={item.output}
              inputs={ExtractChainVariables(items.slice(index + 1))}
              onMapOutput={mapOutput(index)}
            />
          </div>
        ))}
        <PromptSelector
          key={items.map(item => item.versionID).join('')}
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
