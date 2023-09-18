import { ActiveChain, ChainItem, ChainItemWithInputs, ChainVersion, PromptInputs, TestConfig } from '@/types'
import { useState } from 'react'
import { ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'
import useInputValues from '@/src/client/hooks/useInputValues'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import RunTimeline from './runTimeline'
import TestDataPane from './testDataPane'
import RunButtons from './runButtons'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem } from './chainNode'
import { SingleTabHeader } from './tabSelector'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import { PromptCache } from '../src/client/hooks/usePromptCache'

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

export const ExtractChainVariables = (chain: ChainItem[], cache: PromptCache, includingDynamic: boolean) => [
  ...new Set(chain.flatMap(item => ExtractChainItemVariables(item, cache, includingDynamic))),
]

const ExcludeBoundChainVariables = (allChainVariables: string[], chain: ChainItem[]) => {
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allChainVariables.filter(variable => !boundInputVariables.includes(variable))
}

const ExtractUnboundChainVariables = (chain: ChainItem[], cache: PromptCache, includingDynamic: boolean) => {
  const allInputVariables = ExtractChainVariables(chain, cache, includingDynamic)
  return ExcludeBoundChainVariables(allInputVariables, chain)
}

export default function ChainNodeOutput({
  chain,
  activeVersion,
  activeRunID,
  items,
  activeNode,
  promptCache,
  prepareForRunning,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  activeRunID?: number
  items: ChainItem[]
  activeNode: ChainNode
  promptCache: PromptCache
  prepareForRunning: (items: ChainItem[]) => Promise<number>
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(chain, JSON.stringify(activeNode))
  const [testConfig, setTestConfig] = useState<TestConfig>({ mode: 'first', rowIndices: [0] })

  const checkProviderAvailable = useCheckProvider()
  const areProvidersAvailable = (items: ChainItem[]) =>
    items
      .filter(IsPromptChainItem)
      .map(promptCache.versionForItem)
      .every(version => !!version && checkProviderAvailable(version.config.provider))

  const [runVersion, partialRuns, isRunning] = useRunVersion()
  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    if (areProvidersAvailable(items)) {
      await runVersion(() => prepareForRunning(items), inputs)
    }
  }

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
              runs={[...activeVersion.runs, ...partialRuns]}
              activeItem={chain}
              activeRunID={activeRunID}
              version={activeVersion}
              isRunning={isRunning}
            />
          </div>
        )}
        <div className='flex items-center justify-end w-full gap-4 px-4'>
          <RunButtons
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
