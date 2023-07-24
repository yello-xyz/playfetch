import TestDataPane from './testDataPane'
import TestButtons from './testButtons'
import { PromptCache } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import { ChainItem, InputValues, PromptInputs } from '@/types'
import { ReactNode } from 'react'

export default function TestChainTab({
  items,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  promptCache,
  runChain,
  tabSelector,
}: {
  items: ChainItem[]
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  promptCache: PromptCache
  runChain: (inputs: PromptInputs[]) => Promise<void>
  tabSelector: ReactNode
}) {
  const variables = ExtractUnboundChainVariables(items, promptCache)

  return (
    <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 max-w-[50%]'>
      <div className='flex flex-col flex-grow gap-2'>
        {tabSelector}
        <TestDataPane
          variables={variables}
          inputValues={inputValues}
          setInputValues={setInputValues}
          persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          emptyMessage='Chain has no unbound inputs'
        />
      </div>
      <TestButtons variables={variables} inputValues={inputValues} callback={runChain} />
    </div>
  )
}
