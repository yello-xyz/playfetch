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
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import useModifiedVersion from '@/src/client/hooks/useModifiedVersion'
import { SelectAnyInputValue } from '@/src/client/inputRows'

export const LoadPendingVersion = (
  versions: PromptVersion[],
  activeVersion: PromptVersion,
  setActiveVersion: (version: PromptVersion) => void,
  modifiedVersion: PromptVersion
) => {
  const pendingVersion = versions.findLast(version => !version.didRun)
  const canLoadPendingVersion =
    !!pendingVersion && activeVersion.id !== pendingVersion.id && PromptVersionsAreEqual(activeVersion, modifiedVersion)
  return canLoadPendingVersion ? () => setActiveVersion(pendingVersion) : undefined
}

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
  type ActiveTab = 'Prompt versions' | 'Test data'
  const [activeTab, setActiveTab] = useState<ActiveTab>('Prompt versions')

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(prompt, activeTab)
  const [testConfig, setTestConfig] = useState<TestConfig>({ mode: 'first', rowIndices: [0] })

  const [runVersion, partialRuns, isRunning] = useRunVersion(activeVersion.id)
  const runPrompt = async (getVersion: () => Promise<number>, inputs: PromptInputs[], continuationID?: number) => {
    persistInputValuesIfNeeded()
    await runVersion(getVersion, inputs, continuationID)
  }
  const saveAndRun = async (inputs: PromptInputs[]) => runPrompt(savePrompt, inputs)

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    persistInputValuesIfNeeded()
  }

  const [currentVersion, updateVersion, isDirty] = useModifiedVersion(activeVersion, setModifiedVersion)
  const variables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, true)
  const staticVariables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config, false)
  const canShowTestData = variables.length > 0 || Object.keys(prompt.inputValues).length > 0
  const tabSelector = (children?: ReactNode) => (
    <TabSelector
      tabs={canShowTestData ? ['Prompt versions', 'Test data'] : ['Prompt versions']}
      activeTab={activeTab}
      setActiveTab={selectTab}>
      {children}
    </TabSelector>
  )

  if (activeTab === 'Test data' && !canShowTestData) {
    setActiveTab('Prompt versions')
  }

  const loadPendingVersion = LoadPendingVersion(prompt.versions, activeVersion, setActiveVersion, currentVersion)

  const minWidth = 280
  const minTopPaneHeight = 120
  const [promptHeight, setPromptHeight] = useState(1)
  const minHeight = promptHeight + 2 * 16
  return (
    <Allotment>
      <Allotment.Pane className='bg-gray-25' minSize={minWidth} preferredSize='50%'>
        <Allotment vertical>
          <Allotment.Pane minSize={minTopPaneHeight}>
            {activeTab === 'Prompt versions' ? (
              <div className='h-full'>
                <VersionTimeline
                  activeItem={prompt}
                  versions={prompt.versions.filter(version => version.didRun)}
                  activeVersion={activeVersion}
                  setActiveVersion={setActiveVersion}
                  tabSelector={tabSelector}
                />
              </div>
            ) : (
              <div className='flex flex-col h-full min-h-0 overflow-hidden grow'>
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
            )}
          </Allotment.Pane>
          <Allotment.Pane
            minSize={minHeight}
            preferredSize={minHeight}
            className='z-10 drop-shadow-[0_-4px_4px_rgba(0,0,0,0.03)]'>
            <div className='h-full p-4 bg-white'>
              <PromptPanel
                version={activeVersion}
                setModifiedVersion={updateVersion}
                runPrompt={saveAndRun}
                inputValues={inputValues}
                testConfig={testConfig}
                setTestConfig={setTestConfig}
                onShowTestConfig={activeTab !== 'Test data' ? () => setActiveTab('Test data') : undefined}
                loadPendingVersion={loadPendingVersion}
                isDirty={isDirty}
                isRunning={isRunning}
                setPreferredHeight={setPromptHeight}
              />
            </div>
          </Allotment.Pane>
        </Allotment>
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
