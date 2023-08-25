import {
  ActiveChain,
  ChainItem,
  ChainItemWithInputs,
  ChainVersion,
  CodeChainItem,
  CodeConfig,
  PartialRun,
  PromptInputs,
  PromptVersion,
  RunConfig,
  TestConfig,
} from '@/types'
import { useState } from 'react'
import DropdownMenu from './dropdownMenu'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { PromptCache } from './chainView'
import PromptInput from './promptInput'
import useInputValues from './useInputValues'
import useCheckProvider from './checkProvider'
import { ConsumeRunStreamReader } from './promptView'
import api from '@/src/client/api'
import RunTimeline from './runTimeline'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import Label from './label'
import PromptChainNodeEditor from './promptChainNodeEditor'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import { SingleTabHeader } from './tabSelector'

export const ExtractUnboundChainInputs = (chainWithInputs: ChainItemWithInputs[]) => {
  const allChainInputs = chainWithInputs.flatMap(item => item.inputs ?? [])
  return ExcludeBoundChainVariables(allChainInputs, chainWithInputs)
}

export const ExtractChainItemVariables = (item: ChainItem, cache: PromptCache) => {
  if (IsCodeChainItem(item)) {
    return ExtractPromptVariables(item.code)
  }
  const version = cache.versionForItem(item)
  return version ? ExtractPromptVariables(version.prompt) : item.inputs ?? []
}

const ExcludeBoundChainVariables = (allChainVariables: string[], chain: ChainItem[]) => {
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allChainVariables.filter(variable => !boundInputVariables.includes(variable))
}

const ExtractChainVariables = (chain: ChainItem[], cache: PromptCache) => [
  ...new Set(chain.flatMap(item => ExtractChainItemVariables(item, cache))),
]

const ExtractUnboundChainVariables = (chain: ChainItem[], cache: PromptCache) => {
  const allInputVariables = ExtractChainVariables(chain, cache)
  return ExcludeBoundChainVariables(allInputVariables, chain)
}

const ChainItemToConfig = (item: ChainItem): RunConfig | CodeConfig =>
  IsPromptChainItem(item)
    ? {
        versionID: item.versionID,
        output: item.output,
        includeContext: item.includeContext,
      }
    : {
        code: item.code,
        output: item.output,
      }

export default function ChainNodeEditor({
  chain,
  chainVersion,
  items,
  setItems,
  activeItemIndex,
  activeNode,
  promptCache,
  prepareForRunning,
  savePrompt,
  selectVersion,
  setModifiedVersion,
}: {
  chain: ActiveChain
  chainVersion: ChainVersion
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  activeItemIndex: number
  activeNode: ChainNode
  promptCache: PromptCache
  prepareForRunning: (items: ChainItem[]) => Promise<number>
  savePrompt: () => Promise<number>
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(chain, JSON.stringify(activeNode))
  const [testConfig, setTestConfig] = useState<TestConfig>({ mode: 'first', rowIndices: [0] })

  const checkProviderAvailable = useCheckProvider()

  const [editingIndex, setEditingIndex] = useState<number>()
  const [editedCode, setEditedCode] = useState<string>('')
  const [editingItemsCount, setEditingItemsCount] = useState(items.length)
  const isEditing = editingIndex !== undefined

  const currentItems = items.map((item, index) => (index === editingIndex ? { ...item, code: editedCode } : item))
  const updatedItems = (items: ChainItem[], index: number, item: ChainItem) => [
    ...items.slice(0, index),
    item,
    ...items.slice(index + 1),
  ]

  const toggleEditing = () => {
    setEditingIndex(isEditing ? undefined : activeItemIndex)
    setEditedCode(isEditing ? '' : (items[activeItemIndex] as CodeChainItem).code)
    setEditingItemsCount(items.length)
  }

  if (isEditing && editingIndex !== activeItemIndex) {
    setTimeout(() => setItems(currentItems))
    toggleEditing()
  } else if (isEditing && items.length !== editingItemsCount) {
    if (items.length === editingItemsCount + 1) {
      // This means an item was inserted at the position of the item we were editing, so we
      // need to persist the edit to the item which now has a index one higher than before.
      setTimeout(() =>
        setItems(updatedItems(items, editingIndex + 1, { ...items[editingIndex + 1], code: editedCode }))
      )
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
        newItems = updatedItems(currentItems, activeItemIndex, { ...activeNode, versionID })
        versionForItem = item =>
          item.promptID === activePrompt.id
            ? activePrompt.versions.find(version => version.id === item.versionID)
            : promptCache.versionForItem(item)
      }
      const versions = newItems.filter(IsPromptChainItem).map(versionForItem)
      if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
        setRunning(true)
        setPartialRuns([])
        const chainVersionID = await prepareForRunning(newItems)
        const streamReader = await api.runChain(chainVersionID, inputs)
        await ConsumeRunStreamReader(streamReader, setPartialRuns)
        setRunning(false)
      }
    }
  }

  const mapOutput = (output?: string) => {
    const newItems = currentItems.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    setItems(updatedItems(newItems, activeItemIndex, { ...newItems[activeItemIndex], output }))
  }

  const toggleIncludeContext = (includeContext: boolean) =>
    setItems(updatedItems(items, activeItemIndex, { ...items[activeItemIndex], includeContext }))

  const variables = ExtractUnboundChainVariables(items, promptCache)
  const showTestData = variables.length > 0 || Object.keys(inputValues).length > 0

  return (
    <>
      <div className='flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden bg-gray-25'>
        {activeNode === InputNode && (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <SingleTabHeader label='Test data' />
            {showTestData && (
              <TestDataPane
                variables={variables}
                inputValues={inputValues}
                setInputValues={setInputValues}
                persistInputValuesIfNeeded={persistInputValuesIfNeeded}
                testConfig={testConfig}
                setTestConfig={setTestConfig}
              />
            )}
          </div>
        )}
        {IsPromptChainItem(activeNode) && (
          <PromptChainNodeEditor
            node={activeNode}
            index={activeItemIndex}
            items={items}
            toggleIncludeContext={toggleIncludeContext}
            promptCache={promptCache}
            checkProviderAvailable={checkProviderAvailable}
            selectVersion={selectVersion}
            setModifiedVersion={setModifiedVersion}
          />
        )}
        {IsCodeChainItem(activeNode) && (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <SingleTabHeader label='Code block' />
            <div className='p-4'>
              <PromptInput
                key={activeItemIndex}
                placeholder={`'Hello World!'`}
                value={isEditing ? editedCode : activeNode.code}
                setValue={setEditedCode}
                preformatted
              />
            </div>
          </div>
        )}
        {activeNode === OutputNode && (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <RunTimeline
              runs={[...chainVersion.runs, ...partialRuns]}
              activeItem={chain}
              version={chainVersion}
              isRunning={isRunning}
            />
          </div>
        )}
        <div className='flex items-center justify-between w-full gap-4 px-4'>
          {IsPromptChainItem(activeNode) || IsCodeChainItem(activeNode) ? (
            <OutputMapper
              key={activeNode.output}
              output={activeNode.output}
              inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache)}
              onMapOutput={mapOutput}
            />
          ) : (
            <div />
          )}
          <TestButtons
            runTitle='Run Chain'
            variables={variables}
            inputValues={inputValues}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            disabled={!items.length}
            callback={runChain}
          />
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
  return inputs.length > 0 ? (
    <div className='self-start py-0.5 flex items-center gap-2'>
      <Label className='whitespace-nowrap'>Map output to</Label>
      <DropdownMenu value={output ?? 0} onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}>
        <option value={0} disabled>
          Select Input
        </option>
        {inputs.map((input, index) => (
          <option key={index} value={input}>
            Input “{input}”
          </option>
        ))}
      </DropdownMenu>
    </div>
  ) : (
    <div />
  )
}
