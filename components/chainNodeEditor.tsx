import {
  ActiveChain,
  ChainItem,
  ChainItemWithInputs,
  ChainVersion,
  PromptInputs,
  PromptVersion,
  TestConfig,
} from '@/types'
import { useState } from 'react'
import DropdownMenu from './dropdownMenu'
import { ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'
import { PromptCache } from './chainView'
import PromptInput from './promptInput'
import useInputValues from '@/src/client/hooks/useInputValues'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import RunTimeline from './runTimeline'
import TestDataPane from './testDataPane'
import RunButtons from './runButtons'
import Label from './label'
import PromptChainNodeEditor from './promptChainNodeEditor'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import { SingleTabHeader } from './tabSelector'
import useRunVersion from '@/src/client/hooks/useRunVersion'

export const ExtractUnboundChainInputs = (chainWithInputs: ChainItemWithInputs[]) => {
  const allChainInputs = chainWithInputs.flatMap(item => item.inputs ?? [])
  return ExcludeBoundChainVariables(allChainInputs, chainWithInputs)
}

export const ExtractChainItemVariables = (item: ChainItem, cache: PromptCache, includingDynamic: boolean) => {
  if (IsCodeChainItem(item)) {
    return ExtractVariables(item.code)
  }
  const version = cache.versionForItem(item)
  return version
    ? ExtractPromptVariables(version.prompts, version.config, includingDynamic)
    : [...(item.inputs ?? []), ...(includingDynamic ? item.dynamicInputs ?? [] : [])] ?? []
}

const ExcludeBoundChainVariables = (allChainVariables: string[], chain: ChainItem[]) => {
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allChainVariables.filter(variable => !boundInputVariables.includes(variable))
}

const ExtractChainVariables = (chain: ChainItem[], cache: PromptCache, includingDynamic: boolean) => [
  ...new Set(chain.flatMap(item => ExtractChainItemVariables(item, cache, includingDynamic))),
]

const ExtractUnboundChainVariables = (chain: ChainItem[], cache: PromptCache, includingDynamic: boolean) => {
  const allInputVariables = ExtractChainVariables(chain, cache, includingDynamic)
  return ExcludeBoundChainVariables(allInputVariables, chain)
}

export default function ChainNodeEditor({
  chain,
  activeVersion,
  activeRunID,
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
  activeVersion: ChainVersion
  activeRunID?: number
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

  const updatedItems = (items: ChainItem[], index: number, item: ChainItem) => [
    ...items.slice(0, index),
    item,
    ...items.slice(index + 1),
  ]

  const checkProviderAvailable = useCheckProvider()
  const areProvidersAvailable = (items: ChainItem[], versionForItem = promptCache.versionForItem) =>
    items
      .filter(IsPromptChainItem)
      .map(versionForItem)
      .every(version => !!version && checkProviderAvailable(version.config.provider))

  const [runVersion, partialRuns, isRunning] = useRunVersion()
  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    let newItems = items
    let versionForItem = promptCache.versionForItem
    if (IsPromptChainItem(activeNode)) {
      const versionID = await savePrompt()
      const activePrompt = await promptCache.refreshPrompt(activeNode.promptID)
      newItems = updatedItems(items, activeItemIndex, { ...activeNode, versionID })
      versionForItem = item =>
        item.promptID === activePrompt.id
          ? activePrompt.versions.find(version => version.id === item.versionID)
          : promptCache.versionForItem(item)
    }
    if (areProvidersAvailable(newItems, versionForItem)) {
      await runVersion(() => prepareForRunning(newItems), inputs)
    }
  }

  const mapOutput = (output?: string) => {
    const newItems = items.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    setItems(updatedItems(newItems, activeItemIndex, { ...newItems[activeItemIndex], output }))
  }

  const toggleIncludeContext = (includeContext: boolean) =>
    setItems(updatedItems(items, activeItemIndex, { ...items[activeItemIndex], includeContext }))

  const updateCode = (code: string) =>
    setItems(updatedItems(items, activeItemIndex, { ...items[activeItemIndex], code }))

  const variables = ExtractUnboundChainVariables(items, promptCache, true)
  const staticVariables = ExtractUnboundChainVariables(items, promptCache, false)
  const showTestData = variables.length > 0 || Object.keys(inputValues).length > 0
  const colorClass = IsPromptChainItem(activeNode) ? 'bg-white' : 'bg-gray-25'

  return (
    <>
      <div className={`flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden ${colorClass}`}>
        {activeNode === InputNode && (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <SingleTabHeader label='Test data' />
            {showTestData && (
              <TestDataPane
                variables={variables}
                staticVariables={staticVariables}
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
                value={activeNode.code}
                setValue={updateCode}
                preformatted
              />
            </div>
          </div>
        )}
        {activeNode === OutputNode && (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <RunTimeline
              runs={[...activeVersion.runs, ...partialRuns]}
              activeItem={chain}
              activeRunID={activeRunID}
              version={activeVersion}
              isRunning={isRunning}
            />
          </div>
        )}
        <div className='flex items-center justify-between w-full gap-4 px-4'>
          {IsPromptChainItem(activeNode) || IsCodeChainItem(activeNode) ? (
            <OutputMapper
              key={activeNode.output}
              output={activeNode.output}
              inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache, false)}
              onMapOutput={mapOutput}
            />
          ) : (
            <div />
          )}
          <RunButtons
            runTitle='Run Chain'
            variables={variables}
            inputValues={inputValues}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            showTestMode
            disabled={!items.length || !areProvidersAvailable(items)}
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
