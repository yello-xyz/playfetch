import api from '@/src/client/api'
import { useState } from 'react'

import Label from './label'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import { ActivePromptCache } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import RunTimeline from './runTimeline'
import { ChainItem, InputValues, PartialRun } from '@/types'
import { ConsumeRunStreamReader } from './promptTabView'
import useCheckProvider from './checkProvider'

const runChain = async (
  chain: ChainItem[],
  inputs: Record<string, string>[],
  setPartialRuns: (runs: PartialRun[]) => void
) => {
  const versionIDs = chain.map(item => item.versionID)
  if (versionIDs.length > 0) {
    const streamReader = await api.runChain(
      chain.map(item => ({ versionID: item.versionID, output: item.output, includeContext: item.includeContext })),
      inputs
    )
    await ConsumeRunStreamReader(streamReader, setPartialRuns)
  }
}

export default function TestChainTab({
  items,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  promptCache,
}: {
  items: ChainItem[]
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  promptCache: ActivePromptCache
}) {
  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const variables = ExtractUnboundChainVariables(items, promptCache)

  const checkProviderAvailable = useCheckProvider()

  const testChain = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    const versions = items.map(item => promptCache.versionForItem(item))
    if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
      setIsRunning(true)
      await runChain(items, inputs, setPartialRuns)
      setIsRunning(false)
    }
  }

  return (
    <>
      <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 max-w-[50%]'>
        <div className='flex flex-col flex-grow gap-2'>
          <Label>Test Data</Label>
          <TestDataPane
            variables={variables}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        </div>
        <TestButtons variables={variables} inputValues={inputValues} callback={testChain} />
      </div>
      <div className='flex-1 p-6 pl-0'>
        <RunTimeline runs={partialRuns} isRunning={isRunning} />
      </div>
    </>
  )
}
