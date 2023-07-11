import api from '@/src/client/api'
import { useState } from 'react'

import Label from './label'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import { LoadedChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import RunTimeline from './runTimeline'
import { InputValues } from '@/types'
import { ConsumeRunStreamReader } from './promptTabView'

const runChain = async (
  chain: LoadedChainItem[],
  inputs: Record<string, string>[],
  setPartialRuns: (runs: string[]) => void
 ) => {
  const versions = chain.map(item => item.version)
  if (versions.length > 0) {
    const streamReader = await api.runChain(
      chain.map(item => ({
        promptID: item.prompt.id,
        versionID: item.version.id,
        prompt: item.version.prompt,
        config: item.version.config,
        output: item.output,
      })),
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
  const [partialRuns, setPartialRuns] = useState<string[]>([])

  const variables = ExtractUnboundChainVariables(chain)

  const testChain = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    await runChain(chain, inputs, setPartialRuns)
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
        <RunTimeline partialRuns={partialRuns} />
      </div>
    </>
  )
}
