import api from '@/src/client/api'
import { useState } from 'react'

import Label from './label'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import { ActiveChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import RunTimeline from './runTimeline'
import { InputValues, Run } from '@/types'

const runChain = (chain: ActiveChainItem[], inputs: Record<string, string>[]): Promise<Run[]> => {
  const versions = chain.map(item => item.version)
  return versions.length
    ? api.runChain(
        chain.map(item => ({
          promptID: item.prompt.id,
          versionID: item.version.id,
          prompt: item.version.prompt,
          config: item.version.config,
        })),
        inputs,
        chain.map(item => item.output)
      )
    : Promise.resolve([])
}

export default function TestChainTab({
  chain,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
}: {
  chain: ActiveChainItem[]
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
}) {
  const [runs, setRuns] = useState<Run[]>([])

  const variables = ExtractUnboundChainVariables(chain)

  const testChain = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    const runs = await runChain(chain, inputs)
    setRuns(runs)
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
        <RunTimeline runs={runs} />
      </div>
    </>
  )
}
