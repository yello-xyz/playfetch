import { ActiveProject, ChainItem, CodeChainItem, PartialRun, PromptChainItem, PromptInputs, Version } from '@/types'
import { useState } from 'react'
import DropdownMenu from './dropdownMenu'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { PromptCache } from './chainView'
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
import PromptChainNodeEditor from './promptChainNodeEditor'
import { ChainItemToConfig, ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, OutputNode } from './chainNode'

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
  savePrompt,
  selectVersion,
  setModifiedVersion,
}: {
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  activeItemIndex: number
  activeNode: ChainNode
  promptCache: PromptCache
  project: ActiveProject
  onRun: () => void
  savePrompt: () => Promise<number>
  selectVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    project.inputValues,
    project.id,
    JSON.stringify(activeNode)
  )

  const checkProviderAvailable = useCheckProvider()

  const updateItem = (item: ChainItem, items = currentItems, index = activeItemIndex) => {
    setItems([...items.slice(0, index), item, ...items.slice(index + 1)])
  }

  const [editingIndex, setEditingIndex] = useState<number>()
  const [editedCode, setEditedCode] = useState<string>('')
  const [editingItemsCount, setEditingItemsCount] = useState(items.length)
  const currentItems = items.map((item, index) => (index === editingIndex ? { ...item, code: editedCode } : item))
  const isEditing = editingIndex !== undefined

  const toggleEditing = () => {
    setEditingIndex(isEditing ? undefined : activeItemIndex)
    setEditedCode(isEditing ? '' : (items[activeItemIndex] as CodeChainItem).code)
    setEditingItemsCount(items.length)
  }

  if (isEditing && editingIndex !== activeItemIndex) {
    setTimeout(() => setItems(currentItems))
    toggleEditing()
  } else if (isEditing && items.length !== editingItemsCount) {
    if (items.length === editingIndex + 1) {
      // This means an item was inserted at the position of the item we were editing, so we
      // need to persist the edit to the item which now has a index one higher than before.
      setTimeout(() => updateItem({ ...items[editingIndex + 1], code: editedCode }, items, editingIndex + 1))
    }
    toggleEditing()
  } else if (!isEditing && IsCodeChainItem(activeNode)) {
    toggleEditing()
  }

  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [isRunning, setRunning] = useState(false)

  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    if (currentItems.length > 0) {
      let newItems = currentItems
      let versionForItem = promptCache.versionForItem
      if (IsPromptChainItem(activeNode)) {
        const versionID = await savePrompt()
        const activePrompt = await promptCache.refreshPrompt(activeNode.promptID)
        newItems = [
          ...currentItems.slice(0, activeItemIndex),
          { ...activeNode, versionID },
          ...currentItems.slice(activeItemIndex + 1),
        ]
        versionForItem = item =>
          item.promptID === activePrompt.id
            ? activePrompt.versions.find(version => version.id === item.versionID)
            : promptCache.versionForItem(item)
        setItems(newItems)
      }
      const versions = newItems.filter(IsPromptChainItem).map(versionForItem)
      if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
        setRunning(true)
        setPartialRuns([])
        onRun()
        const streamReader = await api.runChain(newItems.map(ChainItemToConfig), inputs)
        await ConsumeRunStreamReader(streamReader, setPartialRuns)
        setRunning(false)
      }
    }
  }

  const mapOutput = (output?: string) => {
    const newItems = currentItems.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    updateItem({ ...newItems[activeItemIndex], output }, newItems)
  }

  const variables = ExtractUnboundChainVariables(items, promptCache)

  const outputMapper = (node: PromptChainItem | CodeChainItem) => (
    <OutputMapper
      key={node.output}
      output={node.output}
      inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache)}
      onMapOutput={mapOutput}
    />
  )

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
              outputMapper={outputMapper}
              checkProviderAvailable={checkProviderAvailable}
              selectVersion={selectVersion}
              setModifiedVersion={setModifiedVersion}
            />
          )}
          {IsCodeChainItem(activeNode) && (
            <>
              <div className='flex items-center justify-between gap-4'>
                <Label className='py-2'>Code Editor</Label>
                {outputMapper(activeNode)}
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
          <TestButtons runTitle='Run Chain' variables={variables} inputValues={inputValues} callback={runChain} />
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
