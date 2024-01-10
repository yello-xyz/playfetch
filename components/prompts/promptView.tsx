import { ActivePrompt, PromptInputs, PromptVersion, TestConfig } from '@/types'

import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from '../runs/runTimeline'
import { ReactNode, useState } from 'react'
import TabSelector, { SingleTabHeader } from '../tabSelector'
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
import Collapsible from '../collapsible'

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
  type ActiveTab = 'Prompt' | 'Version History'
  const [activeTab, setActiveTab] = useState<ActiveTab>('Prompt')

  const [testDataExpanded, setTestDataExpanded] = useState(false)
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(prompt, testDataExpanded.toString())
  const [testConfig, setTestConfig] = useState<TestConfig>({ rowIndices: [0] })

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

  const [currentVersion, updatePrompt, updateConfig, isDirty] = usePromptVersion(activeVersion, setModifiedVersion)

  const checkModelAvailable = useCheckModelAvailable()
  const isModelAvailable = checkModelAvailable(currentVersion.config.model)
  const variables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, true)
  const staticVariables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, false)
  const canShowTestData = variables.length > 0 || Object.keys(prompt.inputValues).length > 0

  const tabs: ActiveTab[] = ['Prompt', 'Version History']

  const tabSelector = (children?: ReactNode) => (
    <TabSelector tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {children}
    </TabSelector>
  )

  const renderTab = (tab: ActiveTab, tabSelector: (children?: ReactNode) => ReactNode) => {
    switch (tab) {
      case 'Prompt':
        return (
          <>
            {tabSelector()}
            <PromptPanel version={currentVersion} updatePrompt={updatePrompt} updateConfig={updateConfig} />
          </>
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
    }
  }

  const minWidth = 280
  return (
    <div className='flex flex-col h-full'>
      <Allotment className='flex-1 bg-gray-25'>
        <Allotment.Pane minSize={minWidth} preferredSize='50%'>
          <div className='flex flex-col h-full'>{renderTab(activeTab, tabSelector)}</div>
        </Allotment.Pane>
        <Allotment.Pane minSize={minWidth}>
          <div className='flex flex-col h-full border-l border-gray-200'>
            <SingleTabHeader label='Responses' />
            <div className='flex-1 min-h-0 overflow-y-auto'>
              <RunTimeline
                runs={[...activeVersion.runs, ...partialRuns]}
                activeItem={prompt}
                version={activeVersion}
                focusRunID={focusRunID}
                runVersion={runPrompt}
                selectInputValue={SelectAnyInputValue(inputValues, testConfig)}
                isRunning={isRunning}
                skipHeader
              />
            </div>
          </div>
        </Allotment.Pane>
      </Allotment>
      <div className='border-t border-gray-200' />
      {canShowTestData && (
        <div className='max-h-[50%] overflow-y-auto'>
          <Collapsible
            key={testDataExpanded.toString()}
            title='Test Data'
            initiallyExpanded={testDataExpanded}
            className='pb-4 border-t border-gray-200'
            titleClassName='py-1.5 pl-0.5'>
            <TestDataPane
              variables={variables}
              staticVariables={staticVariables}
              inputValues={inputValues}
              setInputValues={setInputValues}
              persistInputValuesIfNeeded={persistInputValuesIfNeeded}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
            />
          </Collapsible>
        </div>
      )}
      <div className={canShowTestData ? 'px-4 pb-4' : 'p-4'}>
        <RunButtons
          runTitle={activeVersion.runs.length > 0 && !isDirty ? 'Run again' : 'Run'}
          variables={variables}
          staticVariables={staticVariables}
          inputValues={inputValues}
          testConfig={testConfig}
          setTestConfig={setTestConfig}
          onShowTestConfig={() => setTestDataExpanded(true)}
          disabled={!isModelAvailable || !VersionHasNonEmptyPrompts(currentVersion) || isRunning}
          callback={saveAndRun}
          onSave={isDirty ? savePrompt : undefined}
        />
      </div>
    </div>
  )
}
