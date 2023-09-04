import { ReactNode, useState } from 'react'
import {
  ActivePrompt,
  PromptVersion,
  InputValues,
  PromptConfig,
  PromptInputs,
  ActiveProject,
  TestConfig,
  Prompts,
} from '@/types'

import { ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'
import TestDataPane from './testDataPane'
import VersionSelector from './versionSelector'
import RunButtons from './runButtons'
import PromptPanel, { PromptPanelWarning } from './promptPanel'
import { Allotment } from 'allotment'
import { AvailableLabelColorsForItem } from './labelPopupMenu'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'

export default function TestPromptTab({
  currentPrompts,
  currentPromptConfig,
  activeProject,
  activePrompt,
  activeVersion,
  setActiveVersion,
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
  activeProject: ActiveProject
  activePrompt: ActivePrompt
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  runPrompt: (inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const variables = ExtractPromptVariables(currentPrompts)

  const selectVersion = (version: PromptVersion) => {
    persistInputValuesIfNeeded()
    setActiveVersion(version)
  }

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(inputs)
  }

  const checkProviderAvailable = useCheckProvider()
  const isProviderAvailable = checkProviderAvailable(currentPromptConfig.provider)

  const minVersionHeight = 240
  const [promptHeight, setPromptHeight] = useState(1)
  const versionSelectorHeight = 105
  const labelHeight = activeVersion.labels.length || activeVersion.usedInChain || activeVersion.usedAsEndpoint ? 26 : 0
  const preferredHeight = promptHeight + versionSelectorHeight + labelHeight
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <div className='flex flex-col flex-grow h-full min-h-0 pb-4 overflow-hidden'>
          {tabSelector()}
          <TestDataPane
            variables={variables}
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
            <div className='flex items-start gap-2'>
              <VersionSelector
                versions={activePrompt.versions}
                endpoints={activeProject.endpoints}
                activeVersion={activeVersion}
                setActiveVersion={selectVersion}
                labelColors={AvailableLabelColorsForItem(activePrompt)}
              />
              {testConfig.rowIndices.length > 1 && (
                <PromptPanelWarning>
                  Running this prompt will use {testConfig.rowIndices.length} rows of test data.
                </PromptPanelWarning>
              )}
            </div>
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
