import { ActivePrompt, PromptInputs, PromptVersion, TestConfig } from '@/types'

import useInputValues from '@/src/client/tables/useInputValues'
import RunTimeline from '../runs/runTimeline'
import { useEffect, useState } from 'react'
import { ExtractPromptVariables, GetEditorVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'
import useRunVersion from '@/src/client/versions/useRunVersion'
import TestDataPane from '../tables/testDataPane'
import usePromptVersion from '@/src/client/versions/usePromptVersion'
import { SelectAnyInputValue, SelectInputRows } from '@/src/client/tables/inputRows'
import RunButtons from '../runs/runButtons'
import { VersionHasNonEmptyPrompts } from '@/src/common/versionsEqual'
import { useCheckModelAvailable } from '@/src/client/settings/providerContext'
import Collapsible from '../components/collapsible'
import PromptTabs from './promptTabs'
import { usePromptTabs } from '@/src/client/users/userPresetsContext'
import { GetTableRowCount, HasTableData } from '../tables/tableEditor'
import useTestDataActionButtons from '@/src/client/tables/useTestDataActionButtons'

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
  const [promptTabs, setPromptTabs] = usePromptTabs()
  const [testDataExpanded, setTestDataExpanded] = useState(false)
  const [inputValues, setInputValues, persistInputValuesIfNeeded, addInputValues] = useInputValues(
    prompt,
    testDataExpanded.toString()
  )
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

  const [currentVersion, versions, updatePrompt, updateConfig, isDirty] = usePromptVersion(
    prompt,
    activeVersion,
    setModifiedVersion
  )

  const checkModelAvailable = useCheckModelAvailable()
  const isModelAvailable = checkModelAvailable(currentVersion.config.model)
  const variables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, true)
  const staticVariables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, false)

  const [testDataActionButtons, importTestDataButton] = useTestDataActionButtons(
    prompt,
    variables,
    staticVariables,
    inputValues,
    setInputValues,
    persistInputValuesIfNeeded,
    addInputValues,
    testConfig,
    setTestConfig
  )

  const [preferredPromptTabsWidth, setPreferredPromptTabsWidth] = useState('50%')
  useEffect(() => setPreferredPromptTabsWidth(promptTabs.length > 1 ? '66%' : '50%'), [promptTabs])
  const minWidth = 400
  const minTopPaneHeight = 120
  const hasTestData = HasTableData(variables, inputValues)
  const rowCount = GetTableRowCount(variables, inputValues)
  const minBottomPaneHeight = testDataExpanded ? (hasTestData ? Math.min(240, 150 + rowCount * 33) : 224) : 84
  const maxBottomPaneHeight = testDataExpanded ? (hasTestData ? Infinity : 224) : minBottomPaneHeight
  const testDataBorder = hasTestData ? 'mt-1.5 border-t border-b border-gray-200' : '-mt-2.5'
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minTopPaneHeight}>
        <Allotment key={preferredPromptTabsWidth} className='flex-1 bg-gray-25'>
          <Allotment.Pane minSize={minWidth} preferredSize={preferredPromptTabsWidth}>
            <PromptTabs
              prompt={prompt}
              versions={versions}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              currentVersion={currentVersion}
              updatePrompt={updatePrompt}
              updateConfig={updateConfig}
              initialTabs={promptTabs}
              persistTabs={setPromptTabs}
              variables={GetEditorVariables(inputValues, variables, staticVariables)}
            />
          </Allotment.Pane>
          <Allotment.Pane minSize={minWidth}>
            <div className='flex flex-col h-full border-l border-gray-200'>
              <div className='flex-1 min-h-0 overflow-y-auto'>
                <RunTimeline
                  runs={[...activeVersion.runs, ...partialRuns]}
                  activeItem={prompt}
                  version={activeVersion}
                  focusRunID={focusRunID}
                  runVersion={runPrompt}
                  inputs={SelectInputRows(inputValues, variables)}
                  selectInputValue={SelectAnyInputValue(inputValues, testConfig)}
                  isRunning={isRunning}
                />
              </div>
            </div>
          </Allotment.Pane>
        </Allotment>
      </Allotment.Pane>
      <Allotment.Pane minSize={minBottomPaneHeight} maxSize={maxBottomPaneHeight} className='flex flex-col'>
        <div className='flex-1 min-h-0'>
          <Collapsible
            key={testDataExpanded.toString()}
            title='Test Data'
            initiallyExpanded={testDataExpanded}
            className='flex flex-col h-full'
            contentClassName={`${testDataBorder} overflow-y-auto`}
            titleClassName='pt-1.5 pl-0.5'
            rightHandItems={testDataActionButtons('mr-3')}
            onSetExpanded={setTestDataExpanded}>
            <TestDataPane
              variables={variables}
              staticVariables={staticVariables}
              inputValues={inputValues}
              setInputValues={setInputValues}
              addInputValues={addInputValues}
              persistInputValuesIfNeeded={persistInputValuesIfNeeded}
              testConfig={testConfig}
              setTestConfig={setTestConfig}
              importButton={importTestDataButton}
              skipButtonBorder
            />
          </Collapsible>
        </div>
        <div className='px-2 py-2.5'>
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
      </Allotment.Pane>
    </Allotment>
  )
}
