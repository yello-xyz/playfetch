import {
  ActiveProject,
  ChainItem,
  CodeChainItem,
  CodeConfig,
  PartialRun,
  Prompt,
  PromptChainItem,
  PromptInputs,
  Version,
} from '@/types'
import { ReactNode, useState } from 'react'
import DropdownMenu from './dropdownMenu'
import VersionSelector from './versionSelector'
import { ExtractPromptVariables, StripPromptSentinels } from '@/src/common/formatting'
import { PromptCache, IsPromptChainItem, ChainItemToConfig, IsCodeChainItem } from './chainView'
import Checkbox from './checkbox'
import Button from './button'
import RichTextInput from './richTextInput'
import useInputValues from './inputValues'
import useCheckProvider from './checkProvider'
import { ConsumeRunStreamReader } from './promptView'
import api from '@/src/client/api'
import RunTimeline from './runTimeline'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import Label from './label'

export const InputNode = 'input'
export const OutputNode = 'output'
export type ChainNode = PromptChainItem | CodeChainItem | typeof InputNode | typeof OutputNode

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

export default function ChainNodeEditor({
  items,
  setItems,
  activeItemIndex,
  activeNode,
  promptCache,
  project,
}: {
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  activeItemIndex: number
  activeNode: ChainNode
  promptCache: PromptCache
  project: ActiveProject
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    project.inputValues,
    project.id,
    JSON.stringify(activeNode)
  )

  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [isRunning, setRunning] = useState(false)

  const checkProviderAvailable = useCheckProvider()

  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    const versions = items.filter(IsPromptChainItem).map(item => promptCache.versionForItem(item))
    if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
      setRunning(true)
      if (items.length > 0) {
        const streamReader = await api.runChain(items.map(ChainItemToConfig), inputs)
        await ConsumeRunStreamReader(streamReader, setPartialRuns)
      }
      setRunning(false)
    }
  }

  const insertPrompt = (index: number, promptID: number) => () =>
    setItems([...items.slice(0, index), promptCache.promptItemForID(promptID), ...items.slice(index)])

  const replacePrompt = (index: number) => (promptID: number) =>
    setItems([...items.slice(0, index), promptCache.promptItemForID(promptID), ...items.slice(index + 1)])

  const removeItem = (index: number) => () => setItems([...items.slice(0, index), ...items.slice(index + 1)])

  const toggleIncludeContext = (index: number) => (includeContext: boolean) =>
    setItems([...items.slice(0, index), { ...items[index], includeContext }, ...items.slice(index + 1)])

  const selectVersion = (index: number) => (version: Version) =>
    setItems([...items.slice(0, index), { ...items[index], versionID: version.id }, ...items.slice(index + 1)])

  const mapOutput = (index: number) => (output?: string) => {
    const resetChain = items.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    setItems([...resetChain.slice(0, index), { ...resetChain[index], output }, ...resetChain.slice(index + 1)])
  }

  const [isEditing, setEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>()
  const [editedCode, setEditedCode] = useState<string>('')

  const toggleEditing = (code?: string) => {
    const editing = !isEditing
    setEditing(editing)
    setEditedCode(editing ? code ?? (items[editingIndex!] as CodeConfig).code : '')
    setEditingIndex(editing ? activeItemIndex : undefined)
  }

  if (isEditing && editingIndex !== activeItemIndex) {
    toggleEditing()
  }

  const insertCodeBlock = (index: number) => () => {
    const code = `'Hello world'`
    setItems([...items.slice(0, index), { code }, ...items.slice(index)])
    toggleEditing(code)
  }

  const editCodeBlock = (index: number) => () => {
    setEditedCode((items[index] as CodeConfig).code)
    toggleEditing()
  }

  const updateCodeBlock = (index: number) => () => {
    setItems([...items.slice(0, index), { ...items[index], code: editedCode }, ...items.slice(index + 1)])
    toggleEditing()
  }

  const variables = ExtractUnboundChainVariables(items, promptCache)
  const activeVersion = IsPromptChainItem(activeNode) ? promptCache.versionForItem(activeNode) : undefined

  return (
    <>
      <div className='flex flex-col items-end flex-1 h-full gap-4 p-6 overflow-hidden'>
        <div className='flex flex-col flex-1 w-full gap-2 overflow-y-auto'>
          {activeNode === InputNode && (
            <>
              <Label>Test data</Label>
              <TestDataPane
                variables={variables}
                inputValues={inputValues}
                setInputValues={setInputValues}
                persistInputValuesIfNeeded={persistInputValuesIfNeeded}
                emptyMessage='Chain has no unbound inputs'
              />
            </>
          )}
          {IsPromptChainItem(activeNode) && (
            <div className='grid grid-cols-[260px_minmax(0,1fr)] items-center gap-4 p-6 bg-gray-50 rounded-lg'>
              {items.slice(0, activeItemIndex).some(IsPromptChainItem) && (
                <>
                  <Label>Include previous context into prompt</Label>
                  <Checkbox
                    disabled={activeItemIndex === 0}
                    checked={!!activeNode.includeContext}
                    setChecked={toggleIncludeContext(activeItemIndex)}
                  />
                </>
              )}
              <PromptSelector
                prompts={project.prompts}
                selectedPrompt={project.prompts.find(prompt => prompt.id === activeNode.promptID)}
                onSelectPrompt={replacePrompt(activeItemIndex)}
              />
              <Label>Version</Label>
              <VersionSelector
                versions={promptCache.promptForItem(activeNode)?.versions ?? []}
                endpoints={project.endpoints}
                activeVersion={activeVersion}
                setActiveVersion={selectVersion(activeItemIndex)}
                flagIfNotLatest
              />
              {activeVersion && (
                <div className='col-span-2 line-clamp-[9] overflow-y-auto border border-gray-200 p-3 rounded-lg text-gray-400'>
                  {StripPromptSentinels(activeVersion.prompt)}
                </div>
              )}
              <Label>Mapped output</Label>
              <OutputMapper
                key={activeNode.output}
                output={activeNode.output}
                inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache)}
                onMapOutput={mapOutput(activeItemIndex)}
              />
            </div>
          )}
          {IsCodeChainItem(activeNode) && (
            <>
              <div className='w-full'>
                <RichTextInput
                  value={isEditing ? editedCode : activeNode.code}
                  setValue={setEditedCode}
                  disabled={!isEditing}
                  focus={isEditing}
                  preformatted
                />
              </div>
              <div className='flex items-center gap-4'>
                <Label className='whitespace-nowrap'>Mapped output</Label>
                <OutputMapper
                  key={activeNode.output}
                  output={activeNode.output}
                  inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache)}
                  onMapOutput={mapOutput(activeItemIndex)}
                />
              </div>
            </>
          )}
          {activeNode === OutputNode && <RunTimeline runs={partialRuns} isRunning={isRunning} />}
        </div>
        <div className='flex justify-end gap-4'>
          {IsCodeChainItem(activeNode) &&
            (isEditing ? (
              <Button type='primary' onClick={updateCodeBlock(activeItemIndex)}>
                Save
              </Button>
            ) : (
              <Button type='primary' onClick={editCodeBlock(activeItemIndex)}>
                Edit
              </Button>
            ))}
          {activeItemIndex >= 0 && (
            <>
              {activeNode !== OutputNode && (
                <Button type='destructive' onClick={removeItem(activeItemIndex)}>
                  Remove
                </Button>
              )}
              {project.prompts.length > 0 && (
                <Button type='outline' onClick={insertPrompt(activeItemIndex, project.prompts[0].id)}>
                  Insert Prompt
                </Button>
              )}
              <Button type='outline' onClick={insertCodeBlock(activeItemIndex)}>
                Insert Code Block
              </Button>
            </>
          )}
          <TestButtons variables={variables} inputValues={inputValues} callback={runChain} />
        </div>
      </div>
    </>
  )
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
  )
}

function PromptSelector({
  prompts,
  selectedPrompt,
  onSelectPrompt,
}: {
  prompts: Prompt[]
  selectedPrompt?: Prompt
  onSelectPrompt: (promptID: number) => void
}) {
  return (
    <>
      <Label>Prompt</Label>
      <DropdownMenu value={selectedPrompt?.id} onChange={value => onSelectPrompt(Number(value))}>
        {prompts.map((prompt, index) => (
          <option key={index} value={prompt.id}>
            {prompt.name}
          </option>
        ))}
      </DropdownMenu>
    </>
  )
}
