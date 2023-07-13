import api from '@/src/client/api'
import { useState } from 'react'

import Label from './label'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import { LoadedChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import RunTimeline from './runTimeline'
import { InputValues, PartialRun } from '@/types'
import { ConsumeRunStreamReader } from './promptTabView'
import useCheckProvider from './checkProvider'

const runChain = async (
  chain: LoadedChainItem[],
  inputs: Record<string, string>[],
  setPartialRuns: (runs: PartialRun[]) => void
) => {
  const versions = chain.map(item => item.version)
  if (versions.length > 0) {
    const streamReader = await api.runChain(
      chain.map(item => ({ versionID: item.version.id, output: item.output, includeContext: item.includeContext })),
      inputs
    )
    await ConsumeRunStreamReader(streamReader, setPartialRuns)
  }
}

export default function TestChainTab({
  chain,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
}: {
  chain: LoadedChainItem[]
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
}) {
  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const variables = ExtractUnboundChainVariables(chain)

  const checkProviderAvailable = useCheckProvider()

  const testChain = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    if (chain.every(item => checkProviderAvailable(item.version.config.provider))) {
      setIsRunning(true)
      await runChain(chain, inputs, setPartialRuns)
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
