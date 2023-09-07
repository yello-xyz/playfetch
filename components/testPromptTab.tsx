import { ReactNode, useState } from 'react'
import { PromptVersion, InputValues, PromptConfig, PromptInputs, TestConfig, Prompts } from '@/types'

import { ExtractPromptVariables } from '@/src/common/formatting'
import TestDataPane from './testDataPane'
import RunButtons from './runButtons'
import PromptPanel, { PromptPanelWarning } from './promptPanel'
import { Allotment } from 'allotment'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'

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

  const checkProviderAvailable = useCheckProvider()
  const isProviderAvailable = checkProviderAvailable(currentPromptConfig.provider)
  const showMultipleInputsWarning = testConfig.rowIndices.length > 1

  const minVersionHeight = 240
  const [promptHeight, setPromptHeight] = useState(1)
  const runButtonsHeight = 55
  const warningsHeight = showMultipleInputsWarning ? 53 : 0
  const preferredHeight = promptHeight + runButtonsHeight + warningsHeight
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
      <Allotment.Pane minSize={Math.min(350, preferredHeight)} preferredSize={preferredHeight}>
        <div className='h-full p-4 bg-white'>
          <div className='flex flex-col h-full gap-4'>
            {showMultipleInputsWarning && (
              <PromptPanelWarning>
                Running this prompt will use {testConfig.rowIndices.length} rows of test data.
              </PromptPanelWarning>
            )}
            <PromptPanel
              initialPrompts={currentPrompts}
              initialConfig={currentPromptConfig}
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              onUpdatePreferredHeight={setPromptHeight}
            />
            <RunButtons
              variables={variables}
              inputValues={inputValues}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
              showTestMode
              disabled={!isProviderAvailable || !currentPrompts.main.length}
              callback={testPrompt}
            />
          </div>
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
