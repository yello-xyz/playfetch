import { ActivePrompt, PromptInputs, PromptVersion, TestConfig } from '@/types'

import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { ReactNode, useState } from 'react'
import TabSelector from './tabSelector'
import useInitialState from '@/src/client/hooks/useInitialState'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import useCommentSelection from '@/src/client/hooks/useCommentSelection'
import PromptPanel from './promptPanel'
import VersionTimeline from './versionTimeline'
import TestDataPane from './testDataPane'

export default function PromptView({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  showComments,
  setShowComments,
  savePrompt,
}: {
  prompt: ActivePrompt
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  savePrompt: () => Promise<number>
}) {
  type ActiveTab = 'Prompt versions' | 'Test data'
  const [activeTab, setActiveTab] = useState<ActiveTab>('Prompt versions')

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(prompt, activeTab)
  const [testConfig, setTestConfig] = useState<TestConfig>({ mode: 'first', rowIndices: [0] })

  const [currentVersion, setCurrentVersion] = useInitialState(activeVersion, (a, b) => a.id === b.id)
  const updateVersion = (version: PromptVersion) => {
    setCurrentVersion(version)
    setModifiedVersion(version)
  }

  const [activeRunID, selectComment] = useCommentSelection(activeVersion, setActiveVersion)

  const [runVersion, partialRuns, isRunning] = useRunVersion()
  const runPrompt = (inputs: PromptInputs[]) => runVersion(savePrompt, inputs)

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(inputs)
  }

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    persistInputValuesIfNeeded()
  }

  const variables = ExtractPromptVariables(currentVersion.prompts, currentVersion.config)
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

  const minWidth = 280
  const minTopPaneHeight = 120
  const [promptHeight, setPromptHeight] = useState(1)
  const minHeight = promptHeight + 2 * 16
  const [maxHeight, setMaxHeight] = useState<number>()
  return (
    <Allotment>
      <Allotment.Pane className='bg-gray-25' minSize={minWidth} preferredSize='50%'>
        <Allotment vertical>
          <Allotment.Pane minSize={minTopPaneHeight}>
            {activeTab === 'Prompt versions' ? (
              <div className='h-full'>
                <VersionTimeline
                  activeItem={prompt}
                  versions={prompt.versions}
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
          <Allotment.Pane minSize={minHeight} preferredSize={minHeight} maxSize={maxHeight}>
            <div className='h-full p-4 bg-white'>
              <PromptPanel
                version={activeVersion}
                setModifiedVersion={updateVersion}
                runPrompt={activeTab === 'Test data' ? testPrompt : runPrompt}
                inputValues={inputValues}
                testConfig={testConfig}
                setTestConfig={setTestConfig}
                showTestMode={activeTab === 'Test data'}
                setPreferredHeight={setPromptHeight}
                setMaxHeight={setMaxHeight}
              />
            </div>
          </Allotment.Pane>
        </Allotment>
      </Allotment.Pane>
      <Allotment.Pane minSize={minWidth}>
        <div className='h-full bg-gray-25'>
          <RunTimeline
            runs={[...activeVersion.runs, ...partialRuns]}
            activeItem={prompt}
            version={activeVersion}
            activeRunID={activeRunID}
            isRunning={isRunning}
          />
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={showComments ? minWidth : 0} preferredSize={minWidth} visible={showComments}>
        <CommentsPane
          activeItem={prompt}
          versions={prompt.versions}
          onSelectComment={selectComment}
          showComments={showComments}
          setShowComments={setShowComments}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
