import { ReactNode, useState } from 'react'
import { PromptVersion, InputValues, PromptConfig, PromptInputs, TestConfig, Prompts } from '@/types'

import { ExtractPromptVariables } from '@/src/common/formatting'
import TestDataPane from './testDataPane'
import PromptPanel from './promptPanel'
import { Allotment } from 'allotment'

export default function TestPromptTab({
  currentPrompts,
  currentPromptConfig,
  activeVersion,
  setModifiedVersion,
  runPrompt,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  testConfig,
  setTestConfig,
  tabSelector,
}: {
  currentPrompts: Prompts
  currentPromptConfig: PromptConfig
  activeVersion: PromptVersion
  setModifiedVersion: (version: PromptVersion) => void
  runPrompt: (inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const variables = ExtractPromptVariables(currentPrompts, currentPromptConfig)
  const staticVariables = ExtractPromptVariables(currentPrompts, currentPromptConfig, false)

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(inputs)
  }

  const minVersionHeight = 240
  const [promptHeight, setPromptHeight] = useState(1)
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <div className='flex flex-col h-full min-h-0 pb-4 overflow-hidden grow'>
          {tabSelector()}
          <TestDataPane
            variables={variables}
            staticVariables={staticVariables}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
          />
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={Math.min(350, promptHeight)} preferredSize={promptHeight}>
        <div className='h-full p-4 bg-white'>
          <PromptPanel
            initialPrompts={currentPrompts}
            initialConfig={currentPromptConfig}
            version={activeVersion}
            setModifiedVersion={setModifiedVersion}
            runPrompt={testPrompt}
            inputValues={inputValues}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            showTestMode
            onUpdatePreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
