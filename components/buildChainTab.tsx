import { ActiveProject, ChainItem, CodeConfig, Prompt, Version } from '@/types'
import { ReactNode, useState } from 'react'
import DropdownMenu from './dropdownMenu'
import VersionSelector from './versionSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import Label from './label'
import { PromptCache, IsPromptChainItem } from './chainTabView'
import InputVariable from './inputVariable'
import Checkbox from './checkbox'
import Button from './button'
import RichTextInput from './richTextInput'

const ExtractChainVariables = (chain: ChainItem[], cache: PromptCache) => [
  ...new Set(
    chain.flatMap(item =>
      ExtractPromptVariables(IsPromptChainItem(item) ? cache.versionForItem(item)?.prompt ?? '' : item.code)
    )
  ),
]

export const ExtractUnboundChainVariables = (chain: ChainItem[], cache: PromptCache) => {
  const allInputVariables = ExtractChainVariables(chain, cache)
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allInputVariables.filter(variable => !boundInputVariables.includes(variable))
}

export default function BuildChainTab({
  items,
  setItems,
  prompts,
  promptCache,
  project,
}: {
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  prompts: Prompt[]
  promptCache: PromptCache
  project: ActiveProject
}) {
  const chainItemFromPromptID = (promptID: number): ChainItem => {
    const prompt = prompts.find(prompt => prompt.id === promptID)!
    const versionID = prompt.lastVersionID
    const cachedPrompt = promptCache.promptForID(promptID)
    return {
      promptID,
      versionID,
      ...(cachedPrompt ? { prompt: cachedPrompt, version: cachedPrompt.versions.slice(-1)[0] } : {}),
    }
  }

  const addPrompt = (promptID: number) => setItems([...items, chainItemFromPromptID(promptID)])

  const replacePrompt = (index: number) => (promptID: number) =>
    setItems([...items.slice(0, index), chainItemFromPromptID(promptID), ...items.slice(index + 1)])

  const removeItem = (index: number) => () => setItems([...items.slice(0, index), ...items.slice(index + 1)])

  const toggleIncludeContext = (index: number) => (includeContext: boolean) =>
    setItems([...items.slice(0, index), { ...items[index], includeContext }, ...items.slice(index + 1)])

  const selectVersion = (index: number) => (version: Version) =>
    setItems([...items.slice(0, index), { ...items[index], versionID: version.id }, ...items.slice(index + 1)])

  const mapOutput = (index: number) => (output?: string) => {
    const resetChain = items.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    setItems([...resetChain.slice(0, index), { ...resetChain[index], output }, ...resetChain.slice(index + 1)])
  }

  const [editCodeIndex, setEditCodeIndex] = useState<number>()
  const [editedCode, setEditedCode] = useState<string>('')

  const insertCodeBlock = (index: number) => () => {
    const code = `'Hello world'`
    setItems([...items.slice(0, index), { code }, ...items.slice(index)])
    setEditCodeIndex(index)
    setEditedCode(code)
  }

  const editCodeBlock = (index: number) => () => {
    setEditedCode((items[index] as CodeConfig).code)
    setEditCodeIndex(index)
  }

  const updateCodeBlock = (index: number) => () => {
    setItems([...items.slice(0, index), { ...items[index], code: editedCode }, ...items.slice(index + 1)])
    setEditCodeIndex(undefined)
  }

  return (
    <>
      <div className='flex flex-col flex-grow h-full gap-2 p-6 overflow-y-auto'>
        <div className='flex flex-wrap gap-2'>
          <Label>Inputs:</Label>
          {ExtractUnboundChainVariables(items, promptCache).map((variable, index) => (
            <InputVariable key={index}>{variable}</InputVariable>
          ))}
        </div>
        {items.map((item, index) => (
          <div key={index} className='flex items-start gap-2'>
            {IsPromptChainItem(item) && (
              <>
                <Column wide>
                  <Checkbox
                    disabled={index === 0}
                    checked={!!item.includeContext}
                    setChecked={toggleIncludeContext(index)}
                  />
                  <PromptSelector
                    prompts={prompts}
                    selectedPrompt={prompts.find(prompt => prompt.id === item.promptID)}
                    onSelectPrompt={replacePrompt(index)}
                    onInsertCodeBlock={insertCodeBlock(index)}
                    onRemovePrompt={removeItem(index)}
                  />
                </Column>
                <Column>
                  <VersionSelector
                    versions={promptCache.promptForItem(item)?.versions ?? []}
                    endpoints={project.endpoints}
                    activeVersion={promptCache.versionForItem(item)}
                    setActiveVersion={selectVersion(index)}
                    flagIfNotLatest
                  />
                </Column>
              </>
            )}
            {!IsPromptChainItem(item) && (
              <>
                <Column wide>
                  <div className='w-full'>
                    <RichTextInput
                      value={index === editCodeIndex ? editedCode : item.code}
                      setValue={setEditedCode}
                      disabled={index !== editCodeIndex}
                      focus={index === editCodeIndex}
                      preformatted
                    />
                  </div>
                </Column>
                <Column>
                    {editCodeIndex === index ? (
                      <Button type='outline' onClick={updateCodeBlock(index)}>
                        Save
                      </Button>
                    ) : (
                      <Button type='outline' onClick={editCodeBlock(index)}>
                        Edit
                      </Button>
                    )}
                    <Button type='destructive' onClick={removeItem(index)}>
                      Remove
                    </Button>
                </Column>
              </>
            )}
            <OutputMapper
              key={item.output}
              output={item.output}
              inputs={ExtractChainVariables(items.slice(index + 1), promptCache)}
              onMapOutput={mapOutput(index)}
            />
          </div>
        ))}
        <Column>
          <PromptSelector
            key={items.map(item => (IsPromptChainItem(item) ? item.versionID : 'code')).join('')}
            prompts={prompts}
            onSelectPrompt={addPrompt}
            onInsertCodeBlock={insertCodeBlock(items.length)}
            includeAddPromptOption
          />
        </Column>
      </div>
    </>
  )
}

function Column({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={`w-full ${wide ? 'max-w-[25%]' : 'max-w-[15%]'} flex gap-2`}>{children}</div>
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
    <Column>
      <DropdownMenu
        disabled={!inputs.length}
        value={output ?? 0}
        onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}>
        <option value={0}>Map Output</option>
        {inputs.map((input, index) => (
          <option key={index} value={input}>
            {input}
          </option>
        ))}
      </DropdownMenu>
    </Column>
  )
}

function PromptSelector({
  prompts,
  selectedPrompt,
  onSelectPrompt,
  includeAddPromptOption,
  onInsertCodeBlock,
  onRemovePrompt,
}: {
  prompts: Prompt[]
  selectedPrompt?: Prompt
  onSelectPrompt: (promptID: number) => void
  includeAddPromptOption?: boolean
  onInsertCodeBlock: () => void
  onRemovePrompt?: () => void
}) {
  enum Option {
    ADD = 0,
    REMOVE = 1,
    INSERT = 2,
  }

  const selectOption = (value: number) => {
    switch (value) {
      case Option.ADD:
        return
      case Option.REMOVE:
        return onRemovePrompt?.()
      case Option.INSERT:
        return onInsertCodeBlock()
      default:
        return onSelectPrompt(value)
    }
  }

  return (
    <DropdownMenu value={selectedPrompt?.id} onChange={value => selectOption(Number(value))}>
      {includeAddPromptOption && <option value={Option.ADD}>Add Prompt to Chain</option>}
      {prompts.map((prompt, index) => (
        <option key={index} value={prompt.id}>
          {prompt.name}
        </option>
      ))}
      <HackyOptionSeparator />
      <option value={Option.INSERT}>Insert Code Block</option>
      {onRemovePrompt && <HackyOptionSeparator />}
      {onRemovePrompt && <option value={Option.REMOVE}>Remove Prompt from Chain</option>}
    </DropdownMenu>
  )
}

const HackyOptionSeparator = () => <option disabled>────────────────────────────────────</option>
