import api from '@/src/client/api'
import { useState } from 'react'

import Label from './label'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import { ActiveChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import { useRunPrompt } from './testTab'
import RunTimeline from './runTimeline'

const runChain = (chain: ActiveChainItem[], inputs: Record<string, string>[]) => {
  
}

export default function TestChainTab({ chain }: { chain: ActiveChainItem[] }) {
  const variables = ExtractUnboundChainVariables(chain)

  const activePrompt = chain[0].prompt

  // TODO deduplicate this logic
  const [originalInputValues, setOriginalInputValues] = useState(
    Object.fromEntries(activePrompt.inputs.map(input => [input.name, input.values]))
  )
  const [inputValues, setInputValues] = useState(originalInputValues)

  // TODO this should also be persisted when switching tabs
  const persistValuesIfNeeded = () => {
    for (const [variable, inputs] of Object.entries(inputValues)) {
      if (inputs.join(',') !== (originalInputValues[variable] ?? []).join(',')) {
        api.updateInputValues(activePrompt.projectID, variable, inputs)
      }
    }
    setOriginalInputValues(inputValues)
  }

  const runPrompt = useRunPrompt(activePrompt.id)
  const testChain = async (inputs: Record<string, string>[]) => {
    persistValuesIfNeeded()
    // TODO actually run chain
  }

  return chain.length ? (
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
        <TestButtons
          variables={variables}
          inputValues={inputValues}
          callback={testChain}
        />
      </div>
      <div className='flex-1 p-6 pl-0'>
        <RunTimeline runs={chain.slice(-1)[0].version.runs} />
      </div>
    </>
  ) : null
}
