import api from '@/src/client/api'
import { useState } from 'react'

import Label from './label'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import { ActiveChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import RunTimeline from './runTimeline'
import { Run } from '@/types'

const runChain = (chain: ActiveChainItem[], inputs: Record<string, string>[]): Promise<Run[]> => {
  const versions = chain.map(item => item.version)
  return versions.length
    ? api.runChain(
        chain[0].prompt.id,
        versions.map(version => version.id),
        versions.map(version => version.prompt),
        versions.map(version => version.config),
        inputs,
        chain.map(item => item.output)
      )
    : Promise.resolve([])
}

export default function TestChainTab({ chain }: { chain: ActiveChainItem[] }) {
  const [runs, setRuns] = useState<Run[]>([])
  const variables = ExtractUnboundChainVariables(chain)

  const activePrompt = chain[0].prompt

  // TODO deduplicate this bit of logic
  const [originalInputValues, setOriginalInputValues] = useState(
    Object.fromEntries(activePrompt.inputs.map(input => [input.name, input.values]))
  )
  const [inputValues, setInputValues] = useState(originalInputValues)
  const persistValuesIfNeeded = () => {
    for (const [variable, inputs] of Object.entries(inputValues)) {
      if (inputs.join(',') !== (originalInputValues[variable] ?? []).join(',')) {
        api.updateInputValues(activePrompt.projectID, variable, inputs)
      }
    }
    setOriginalInputValues(inputValues)
  }

  const testChain = async (inputs: Record<string, string>[]) => {
    persistValuesIfNeeded()
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
            onPersistInputValues={persistValuesIfNeeded}
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
