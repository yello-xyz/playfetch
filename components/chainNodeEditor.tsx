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
import { useState } from 'react'
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
  onRun,
}: {
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  activeItemIndex: number
  activeNode: ChainNode
  promptCache: PromptCache
  project: ActiveProject
  onRun: () => void
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
    const currentItems = items.map((item, index) => index === editingIndex ? { ...item, code: editedCode } : item)
    if (currentItems.length > 0) {
      const versions = currentItems.filter(IsPromptChainItem).map(item => promptCache.versionForItem(item))
      if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
        setRunning(true)
        onRun()
        const streamReader = await api.runChain(currentItems.map(ChainItemToConfig), inputs)
        await ConsumeRunStreamReader(streamReader, setPartialRuns)
        setRunning(false)
      }  
    }
  }

  const insertPrompt = (index: number, promptID: number) => () =>
    setItems([...items.slice(0, index), promptCache.promptItemForID(promptID), ...items.slice(index)])

  const removeItem = (index: number) => () => setItems([...items.slice(0, index), ...items.slice(index + 1)])

  const mapOutput = (index: number) => (output?: string) => {
    const resetChain = items.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    setItems([...resetChain.slice(0, index), { ...resetChain[index], output }, ...resetChain.slice(index + 1)])
  }

  const [isEditing, setEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>()
  const [editedCode, setEditedCode] = useState<string>('')

  const updateCodeBlock = (index: number) => 
    setItems([...items.slice(0, index), { ...items[index], code: editedCode }, ...items.slice(index + 1)])

  const toggleEditing = (code?: string) => {
    if (isEditing && editedCode !== (items[editingIndex!] as CodeConfig).code) {
      setTimeout(() => updateCodeBlock(editingIndex!), 0)
    }
    const editing = !isEditing
    setEditing(editing)
    setEditingIndex(editing ? activeItemIndex : undefined)
    setEditedCode(editing ? code ?? (items[activeItemIndex] as CodeConfig).code : '')
  }

  if (isEditing && editingIndex !== activeItemIndex) {
    toggleEditing()
  }
  if (!isEditing && IsCodeChainItem(activeNode)) {
    toggleEditing()
  }

  const insertCodeBlock = (index: number) => () => {
    const code = `'Hello world'`
    setItems([...items.slice(0, index), { code }, ...items.slice(index)])
    toggleEditing(code)
  }

  const variables = ExtractUnboundChainVariables(items, promptCache)

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
            <PromptChainNodeEditor
              node={activeNode}
              index={activeItemIndex}
              items={items}
              setItems={setItems}
              project={project}
              promptCache={promptCache}
              onMapOutput={mapOutput(activeItemIndex)}
            />
          )}
          {IsCodeChainItem(activeNode) && (
            <>
              <Label>Code Editor</Label>
              <RichTextInput
                value={isEditing ? editedCode : activeNode.code}
                setValue={setEditedCode}
                disabled={!isEditing}
                focus={isEditing}
                preformatted
              />
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

function PromptChainNodeEditor({
  node,
  index,
  items,
  setItems,
  project,
  promptCache,
  onMapOutput,
}: {
  node: PromptChainItem
  index: number
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  project: ActiveProject
  promptCache: PromptCache
  onMapOutput: (output?: string) => void
}) {
  const loadedVersions = promptCache.promptForItem(node)?.versions ?? []
  const version = promptCache.versionForItem(node)

  const replacePrompt = (index: number) => (promptID: number) =>
    setItems([...items.slice(0, index), promptCache.promptItemForID(promptID), ...items.slice(index + 1)])

  const toggleIncludeContext = (index: number) => (includeContext: boolean) =>
    setItems([...items.slice(0, index), { ...items[index], includeContext }, ...items.slice(index + 1)])

  const selectVersion = (index: number) => (version: Version) =>
    setItems([...items.slice(0, index), { ...items[index], versionID: version.id }, ...items.slice(index + 1)])

  return (
    <div className='grid grid-cols-[260px_minmax(0,1fr)] items-center gap-4 p-6 bg-gray-50 rounded-lg'>
      {items.slice(0, index).some(IsPromptChainItem) && (
        <>
          <Label>Include previous context into prompt</Label>
          <Checkbox disabled={index === 0} checked={!!node.includeContext} setChecked={toggleIncludeContext(index)} />
        </>
      )}
      <PromptSelector
        prompts={project.prompts}
        selectedPrompt={project.prompts.find(prompt => prompt.id === node.promptID)}
        onSelectPrompt={replacePrompt(index)}
      />
      <Label>Version</Label>
      <VersionSelector
        versions={loadedVersions}
        endpoints={project.endpoints}
        activeVersion={version}
        setActiveVersion={selectVersion(index)}
        flagIfNotLatest
      />
      {version && (
        <div className='col-span-2 line-clamp-[9] overflow-y-auto border border-gray-200 p-3 rounded-lg text-gray-400'>
          {StripPromptSentinels(version.prompt)}
        </div>
      )}
      <Label>Mapped output</Label>
      <OutputMapper
        key={node.output}
        output={node.output}
        inputs={ExtractChainVariables(items.slice(index + 1), promptCache)}
        onMapOutput={onMapOutput}
      />
    </div>
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
