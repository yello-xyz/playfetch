import {
  ActiveProject,
  ChainItem,
  CodeChainItem,
  ModelProvider,
  PartialRun,
  Prompt,
  PromptChainItem,
  PromptInputs,
  Version,
} from '@/types'
import { useState } from 'react'
import DropdownMenu from './dropdownMenu'
import { ExtractPromptVariables } from '@/src/common/formatting'
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
import VersionTimeline from './versionTimeline'
import PromptPanel from './promptPanel'
import useSavePrompt from './useSavePrompt'
import { RefreshContext } from './refreshContext'

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

const updatedItems = (items: ChainItem[], item: ChainItem | null, index: number, insert = false) => [
  ...items.slice(0, index),
  ...(item ? [item] : []),
  ...items.slice(index + (insert ? 0 : 1)),
]

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

  const [isEditing, setEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>()
  const [editedCode, setEditedCode] = useState<string>('')
  const currentItems = items.map((item, index) => (index === editingIndex ? { ...item, code: editedCode } : item))

  const toggleEditing = () => {
    const editing = !isEditing
    setEditing(editing)
    setEditingIndex(editing ? activeItemIndex : undefined)
    setEditedCode(editing ? (items[activeItemIndex] as CodeChainItem).code : '')
  }
  if (editingIndex !== undefined && editingIndex !== activeItemIndex) {
    setTimeout(() => updateItem(currentItems[editingIndex], items, editingIndex), 0)
  }
  if (!isEditing && IsCodeChainItem(activeNode)) {
    toggleEditing()
  }

  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    if (currentItems.length > 0) {
      let chainItems = currentItems
      let versionForItem = promptCache.versionForItem
      if (IsPromptChainItem(activeNode)) {
        const versionID = (await savePrompt())!
        const activePrompt = await promptCache.refreshPrompt(activeNode.promptID)
        chainItems = updatedItems(currentItems, { ...activeNode, versionID }, activeItemIndex)
        versionForItem = item =>
          item.promptID === activePrompt.id
            ? activePrompt.versions.find(version => version.id === item.versionID)
            : promptCache.versionForItem(item)
        setItems(chainItems)
      }
      const versions = chainItems.filter(IsPromptChainItem).map(versionForItem)
      if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
        setRunning(true)
        setPartialRuns([])
        onRun()
        const streamReader = await api.runChain(chainItems.map(ChainItemToConfig), inputs)
        await ConsumeRunStreamReader(streamReader, setPartialRuns)
        setRunning(false)
      }
    }
  }

  const updateItem = (item: ChainItem | null, items = currentItems, index = activeItemIndex, insert = false) => {
    setItems(updatedItems(items, item, index, insert))
    if (isEditing) {
      toggleEditing()
    }
  }
  const removeItem = () => updateItem(null)
  const insertItem = (item: ChainItem) => updateItem(item, currentItems, activeItemIndex, true)

  const insertPrompt = () => insertItem(promptCache.promptItemForID(project.prompts[0].id))

  const insertCodeBlock = () => {
    const code = `'Hello world'`
    insertItem({ code })
  }

  const mapOutput = (output?: string) => {
    const resetChain = currentItems.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    updateItem({ ...resetChain[activeItemIndex], output }, resetChain)
  }

  const variables = ExtractUnboundChainVariables(items, promptCache)

  const activePrompt = IsPromptChainItem(activeNode) ? promptCache.promptForItem(activeNode) : undefined
  const [activeVersion, setActiveVersion] = useState<Version>()
  const [savePrompt, setModifiedVersion] = useSavePrompt(activePrompt, activeVersion, setActiveVersion)

  const selectVersion = (version?: Version) => {
    savePrompt()
    setActiveVersion(version)
    setModifiedVersion(undefined)
    if (version) {
      setTimeout(() => updateItem({ ...items[activeItemIndex], versionID: version.id }), 0)
    }
  }

  if (activeVersion?.promptID !== activePrompt?.id) {
    selectVersion(IsPromptChainItem(activeNode) ? promptCache.versionForItem(activeNode) : undefined)
  } else if (activeVersion && activePrompt && !activePrompt.versions.some(version => version.id === activeVersion.id)) {
    selectVersion(activePrompt.versions.slice(-1)[0])
  }

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
              updateItem={updateItem}
              project={project}
              promptCache={promptCache}
              onMapOutput={mapOutput}
              checkProviderAvailable={checkProviderAvailable}
              selectVersion={selectVersion}
              setModifiedVersion={setModifiedVersion}
            />
          )}
          {IsCodeChainItem(activeNode) && (
            <>
              <div className='flex items-center justify-between gap-4'>
                <Label className='py-2'>Code Editor</Label>
                <OutputMapper
                  key={activeNode.output}
                  output={activeNode.output}
                  inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache)}
                  onMapOutput={mapOutput}
                />
              </div>
              <RichTextInput
                value={isEditing ? editedCode : activeNode.code}
                setValue={setEditedCode}
                disabled={!isEditing}
                focus={isEditing}
                preformatted
              />
            </>
          )}
          {activeNode === OutputNode && <RunTimeline runs={partialRuns} isRunning={isRunning} />}
        </div>
        <div className='flex justify-end gap-4'>
          {activeItemIndex >= 0 && (
            <>
              {activeNode !== OutputNode && (
                <Button type='destructive' onClick={removeItem}>
                  Remove
                </Button>
              )}
              {project.prompts.length > 0 && (
                <Button type='outline' onClick={insertPrompt}>
                  Insert Prompt
                </Button>
              )}
              <Button type='outline' onClick={insertCodeBlock}>
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
  updateItem,
  project,
  promptCache,
  onMapOutput,
  checkProviderAvailable,
  selectVersion,
  setModifiedVersion,
}: {
  node: PromptChainItem
  index: number
  items: ChainItem[]
  updateItem: (item: ChainItem) => void
  project: ActiveProject
  promptCache: PromptCache
  onMapOutput: (output?: string) => void
  checkProviderAvailable: (provider: ModelProvider) => boolean
  selectVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const loadedPrompt = promptCache.promptForItem(node)
  const activeVersion = promptCache.versionForItem(node)

  const replacePrompt = (promptID: number) => updateItem(promptCache.promptItemForID(promptID))
  const toggleIncludeContext = (includeContext: boolean) => updateItem({ ...items[index], includeContext })

  return (
    <RefreshContext.Provider value={{ refreshPrompt: () => promptCache.refreshPrompt(node.promptID).then(_ => {}) }}>
      <div className='flex flex-col justify-between flex-grow h-full gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <PromptSelector
            prompts={project.prompts}
            selectedPrompt={project.prompts.find(prompt => prompt.id === node.promptID)}
            onSelectPrompt={replacePrompt}
          />
          <OutputMapper
            key={node.output}
            output={node.output}
            inputs={ExtractChainVariables(items.slice(index + 1), promptCache)}
            onMapOutput={onMapOutput}
          />
        </div>
        {items.slice(0, index).some(IsPromptChainItem) && (
          <div className='self-start'>
            <Checkbox
              label='Include previous context into prompt'
              checked={!!node.includeContext}
              setChecked={toggleIncludeContext}
            />
          </div>
        )}
        {loadedPrompt && activeVersion && (
          <>
            <VersionTimeline
              prompt={loadedPrompt}
              activeVersion={activeVersion}
              setActiveVersion={selectVersion}
              tabSelector={<Label>Prompt Version</Label>}
            />
            <PromptPanel
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              checkProviderAvailable={checkProviderAvailable}
            />
          </>
        )}
      </div>
    </RefreshContext.Provider>
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
    <div className='flex items-center self-start gap-4'>
      <Label className='whitespace-nowrap'>Map output to</Label>
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
    </div>
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
    <div className='flex items-center self-start gap-4'>
      <Label>Prompt</Label>
      <DropdownMenu value={selectedPrompt?.id} onChange={value => onSelectPrompt(Number(value))}>
        {prompts.map((prompt, index) => (
          <option key={index} value={prompt.id}>
            {prompt.name}
          </option>
        ))}
      </DropdownMenu>
    </div>
  )
}
