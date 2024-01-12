import { ActivePrompt, PromptInputs, PromptVersion, TestConfig } from '@/types'

import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from '../runs/runTimeline'
import { useState } from 'react'
import { SingleTabHeader } from '../tabSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import TestDataPane, { GetTestDataRowCount } from '../testData/testDataPane'
import usePromptVersion from '@/src/client/hooks/usePromptVersion'
import { SelectAnyInputValue } from '@/src/client/inputRows'
import RunButtons from '../runs/runButtons'
import { VersionHasNonEmptyPrompts } from '@/src/common/versionsEqual'
import { useCheckModelAvailable } from '@/src/client/context/providerContext'
import Collapsible from '../collapsible'
import PromptTabs from './promptTabs'
import IconButton from '../iconButton'
import expandIcon from '@/public/expand.svg'
import useTestDataPopup from '@/src/client/hooks/useTestDataPopup'

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

  const [currentVersion, versions, updatePrompt, updateConfig, isDirty] = usePromptVersion(
    prompt,
    activeVersion,
    setModifiedVersion
  )

  const checkModelAvailable = useCheckModelAvailable()
  const isModelAvailable = checkModelAvailable(currentVersion.config.model)
  const variables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, true)
  const staticVariables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, false)
  const canShowTestData = variables.length > 0 || Object.keys(prompt.inputValues).length > 0

  const expandTestData = useTestDataPopup(
    variables,
    staticVariables,
    inputValues,
    setInputValues,
    persistInputValuesIfNeeded,
    testConfig,
    setTestConfig
  )

  const minWidth = 400
  const minTopPaneHeight = 120
  const rowCount = GetTestDataRowCount(variables, inputValues)
  const minBottomPaneHeight = canShowTestData ? (testDataExpanded ? Math.min(240, 162 + rowCount * 33) : 94) : 64
  const maxBottomPaneHeight = canShowTestData && testDataExpanded ? Infinity : minBottomPaneHeight
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minTopPaneHeight}>
        <Allotment className='flex-1 bg-gray-25'>
          <Allotment.Pane minSize={minWidth} preferredSize='50%'>
            <PromptTabs
              prompt={prompt}
              versions={versions}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              currentVersion={currentVersion}
              updatePrompt={updatePrompt}
              updateConfig={updateConfig}
            />
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
      </Allotment.Pane>
      <Allotment.Pane minSize={minBottomPaneHeight} maxSize={maxBottomPaneHeight} className='flex flex-col'>
        {canShowTestData && (
          <div className='flex-1 min-h-0'>
            <Collapsible
              key={testDataExpanded.toString()}
              title='Test Data'
              initiallyExpanded={testDataExpanded}
              className='flex flex-col h-full'
              contentClassName='mt-1.5 border-t border-gray-200 overflow-y-auto '
              titleClassName='pt-1.5 pl-0.5'
              rightHandItems={<IconButton className='mr-3 rounded' icon={expandIcon} onClick={expandTestData} />}
              onSetExpanded={setTestDataExpanded}>
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
        <div className='p-4'>
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
