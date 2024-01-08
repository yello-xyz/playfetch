import { ActivePrompt, PromptInputs, PromptVersion, TestConfig } from '@/types'

import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from '../runs/runTimeline'
import { ReactNode, useState } from 'react'
import TabSelector from '../tabSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import PromptPanel from './promptPanel'
import VersionTimeline from '../versions/versionTimeline'
import TestDataPane from '../testData/testDataPane'
import usePromptVersion from '@/src/client/hooks/usePromptVersion'
import { SelectAnyInputValue } from '@/src/client/inputRows'
import RunButtons from '../runs/runButtons'
import { VersionHasNonEmptyPrompts } from '@/src/common/versionsEqual'
import { useCheckModelAvailable } from '@/src/client/context/providerContext'

export default function PromptView({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  savePrompt,
  focusRunID,
}: {
  prompt: ActivePrompt
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  savePrompt: () => Promise<number>
  focusRunID?: number
}) {
  type ActiveTab = 'Prompt' | 'Version History' | 'Test Data'
  const [activeTab, setActiveTab] = useState<ActiveTab>('Prompt')

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(prompt, activeTab)
  const [testConfig, setTestConfig] = useState<TestConfig>({ mode: 'first', rowIndices: [0] })

  const [runVersion, partialRuns, isRunning] = useRunVersion(activeVersion.id)
  const runPrompt = async (
    getVersion: () => Promise<number>,
    inputs: PromptInputs[],
    dynamicInputs: PromptInputs[],
    continuationID?: number
  ) => {
    persistInputValuesIfNeeded()
    await runVersion(getVersion, inputs, dynamicInputs, continuationID, testConfig.autoRespond, testConfig.maxResponses)
  }
  const saveAndRun = async (inputs: PromptInputs[], dynamicInputs: PromptInputs[]) =>
    runPrompt(savePrompt, inputs, dynamicInputs)

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    persistInputValuesIfNeeded()
  }

  const [currentVersion, updatePrompt, updateConfig, isDirty] = usePromptVersion(activeVersion, setModifiedVersion)

  const checkModelAvailable = useCheckModelAvailable()
  const isModelAvailable = checkModelAvailable(currentVersion.config.model)
  const variables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, true)
  const staticVariables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, false)
  const canShowTestData = variables.length > 0 || Object.keys(prompt.inputValues).length > 0

  const tabSelector = (children?: ReactNode) => (
    <TabSelector
      tabs={['Prompt', 'Version History', ...(canShowTestData ? ['Test Data' as ActiveTab] : [])]}
      activeTab={activeTab}
      setActiveTab={selectTab}>
      {children}
    </TabSelector>
  )

  if (activeTab === 'Test Data' && !canShowTestData) {
    setActiveTab('Prompt')
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Prompt':
        return (
          <div className='flex-1 p-4'>
            <PromptPanel version={currentVersion} updatePrompt={updatePrompt} updateConfig={updateConfig} />
          </div>
        )
      case 'Version History':
        return (
          <div className='flex-1 min-h-0'>
            <VersionTimeline
              activeItem={prompt}
              versions={prompt.versions}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              tabSelector={tabSelector}
            />
          </div>
        )
      case 'Test Data':
        return (
          <div className='flex-1 min-h-0 pb-4 overflow-y-auto'>
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
        )
    }
  }

  const minWidth = 280
  return (
    <Allotment>
      <Allotment.Pane className='bg-gray-25' minSize={minWidth} preferredSize='50%'>
        <div className='flex flex-col h-full bg-white'>
          {activeTab !== 'Version History' && tabSelector()}
          {renderActiveTab()}
          <div className='p-4'>
            <RunButtons
              runTitle={activeVersion.runs.length > 0 && !isDirty ? 'Run again' : 'Run'}
              variables={variables}
              staticVariables={staticVariables}
              inputValues={inputValues}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
              onShowTestConfig={activeTab !== 'Test Data' ? () => setActiveTab('Test Data') : undefined}
              disabled={!isModelAvailable || !VersionHasNonEmptyPrompts(currentVersion) || isRunning}
              callback={saveAndRun}
              onSave={savePrompt}
            />
          </div>
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={minWidth}>
        <div className='h-full border-l border-gray-200 bg-gray-25'>
          <RunTimeline
            runs={[...activeVersion.runs, ...partialRuns]}
            activeItem={prompt}
            version={activeVersion}
            focusRunID={focusRunID}
            runVersion={runPrompt}
            selectInputValue={SelectAnyInputValue(inputValues, testConfig)}
            isRunning={isRunning}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
