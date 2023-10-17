import { ActiveChain, ChainItem, ChainItemWithInputs, ChainVersion, PromptInputs, TestConfig } from '@/types'
import { useEffect, useState } from 'react'
import { ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'
import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from '../runs/runTimeline'
import TestDataPane from '../testDataPane'
import RunButtons from '../runs/runButtons'
import {
  ChainNode,
  InputNode,
  IsChainItem,
  IsCodeChainItem,
  IsPromptChainItem,
  IsQueryChainItem,
  OutputNode,
} from './chainNode'
import { SingleTabHeader } from '../tabSelector'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import { ChainPromptCache } from '../../src/client/hooks/useChainPromptCache'
import { useCheckProviders } from '@/src/client/hooks/useAvailableProviders'
import { ProviderForModel } from '@/src/common/providerMetadata'

export const ExtractUnboundChainInputs = (chainWithInputs: ChainItemWithInputs[]) => {
  const allChainInputs = chainWithInputs.map(item => item.inputs ?? [])
  return ExcludeBoundChainVariables(allChainInputs, chainWithInputs)
}

export const ExtractChainItemVariables = (item: ChainItem, cache: ChainPromptCache, includingDynamic: boolean) => {
  if (IsCodeChainItem(item)) {
    return ExtractVariables(item.code)
  }
  if (IsQueryChainItem(item)) {
    return ExtractVariables(item.query)
  }
  const version = cache.versionForItem(item)
  return version
    ? ExtractPromptVariables(version.prompts, version.config, includingDynamic)
    : [...(item.inputs ?? []), ...(includingDynamic ? item.dynamicInputs ?? [] : [])] ?? []
}

const ExcludeBoundChainVariables = (chainInputs: string[][], chain: { output?: string }[]) => {
  const allChainVariables = [...new Set(chainInputs.flat())]
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allChainVariables.filter(variable => !boundInputVariables.includes(variable))
}

export const ExtractUnboundChainVariables = (chain: ChainItem[], cache: ChainPromptCache, includingDynamic: boolean) => {
  const inputs = chain.map(item => ExtractChainItemVariables(item, cache, includingDynamic))
  return ExcludeBoundChainVariables(inputs, chain)
}

export default function ChainNodeOutput({
  chain,
  activeVersion,
  activeRunID,
  nodes,
  activeIndex,
  setActiveIndex,
  promptCache,
  saveItems,
  showRunButtons,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  activeRunID?: number
  nodes: ChainNode[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  promptCache: ChainPromptCache
  saveItems: (items: ChainItem[]) => Promise<number>
  showRunButtons: boolean
}) {
  const activeNode = nodes[activeIndex]
  const items = nodes.filter(IsChainItem)
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(chain, JSON.stringify(activeNode))
  const [testConfig, setTestConfig] = useState<TestConfig>({ mode: 'first', rowIndices: [0] })

  const [checkProviderAvailable, checkModelAvailable] = useCheckProviders()
  const areProvidersAvailable = (items: ChainItem[]) =>
    items
      .filter(IsPromptChainItem)
      .map(promptCache.versionForItem)
      .every(version => !!version && checkModelAvailable(version.config.model)) &&
    items
      .filter(IsQueryChainItem)
      .every(item => checkProviderAvailable(item.provider) && checkProviderAvailable(ProviderForModel(item.model)))

  const [runVersion, partialRuns, isRunning, highestRunIndex] = useRunVersion(activeVersion.id)
  const [runningItemIndex, setRunningItemIndex] = useState<number>(-1)
  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    if (areProvidersAvailable(items)) {
      setActiveIndex(0)
      setRunningItemIndex(-1)
      await runVersion(() => saveItems(items), inputs)
      setActiveIndex(nodes.length - 1)
    }
  }

  useEffect(() => {
    if (highestRunIndex > runningItemIndex) {
      setActiveIndex(highestRunIndex + 1)
      setRunningItemIndex(highestRunIndex)
    }
  }, [setActiveIndex, highestRunIndex, runningItemIndex])

  const variables = ExtractUnboundChainVariables(items, promptCache, true)
  const staticVariables = ExtractUnboundChainVariables(items, promptCache, false)
  const showTestData = variables.length > 0 || Object.keys(inputValues).length > 0

  return (
    <>
      <div className='flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden'>
        {activeNode === InputNode && variables.length > 0 ? (
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
        ) : (
          <div className='flex flex-col flex-1 w-full overflow-y-auto'>
            <RunTimeline
              runs={
                activeNode === OutputNode
                  ? activeVersion.runs
                  : partialRuns.filter(run => run.index === activeIndex - 1)
              }
              activeItem={chain}
              activeRunID={activeRunID}
              version={activeVersion}
              isRunning={isRunning}
            />
          </div>
        )}
        {showRunButtons && (
          <div className='flex items-center justify-end w-full gap-4 px-4'>
            <RunButtons
              variables={variables}
              staticVariables={staticVariables}
              inputValues={inputValues}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
              disabled={!items.length || !areProvidersAvailable(items)}
              callback={runChain}
            />
          </div>
        )}
      </div>
    </>
  )
}
