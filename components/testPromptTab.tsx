import { ReactNode, useState } from 'react'
import {
  ActivePrompt,
  PromptVersion,
  InputValues,
  PromptConfig,
  PromptInputs,
  ModelProvider,
  ActiveProject,
  TestConfig,
} from '@/types'

import { ExtractPromptVariables } from '@/src/common/formatting'
import TestDataPane from './testDataPane'
import VersionSelector from './versionSelector'
import TestButtons from './testButtons'
import PromptPanel from './promptPanel'
import { Allotment } from 'allotment'
import { AvailableLabelColorsForItem } from './labelPopupMenu'

export default function TestPromptTab({
  currentPrompt,
  currentPromptConfig,
  activeProject,
  activePrompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  checkProviderAvailable,
  runPrompt,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  testConfig,
  setTestConfig,
  tabSelector,
}: {
  currentPrompt: string
  currentPromptConfig: PromptConfig
  activeProject: ActiveProject
  activePrompt: ActivePrompt
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  checkProviderAvailable: (provider: ModelProvider) => boolean
  runPrompt: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const variables = ExtractPromptVariables(currentPrompt)

  const selectVersion = (version: PromptVersion) => {
    persistInputValuesIfNeeded()
    setActiveVersion(version)
  }

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(currentPromptConfig, inputs)
  }

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
        <div className='h-full p-4'>
          <div className='flex flex-col h-full gap-4'>
            <div className='flex gap-2'>
              <VersionSelector
                versions={activePrompt.versions}
                endpoints={activeProject.endpoints}
                activeVersion={activeVersion}
                setActiveVersion={selectVersion}
                labelColors={AvailableLabelColorsForItem(activePrompt)}
              />
              {testConfig.rowIndices.length > 1 && (
                <div className='flex-grow px-3 py-2 border rounded border-pink-50 bg-pink-25'>
                  Running this prompt will use {testConfig.rowIndices.length} rows of test data.
                </div>
              )}
            </div>
            <PromptPanel
              initialPrompt={currentPrompt}
              initialConfig={currentPromptConfig}
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              checkProviderAvailable={checkProviderAvailable}
              onUpdatePreferredHeight={setPromptHeight}
            />
            <TestButtons
              variables={variables}
              inputValues={inputValues}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
              disabled={!currentPrompt.length}
              callback={testPrompt}
            />
          </div>
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
