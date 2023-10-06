import { ActivePrompt, PromptInputs, PromptVersion, TestConfig } from '@/types'

import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from '../runs/runTimeline'
import CommentsPane from '../commentsPane'
import { ReactNode, useState } from 'react'
import TabSelector from '../tabSelector'
import useInitialState from '@/src/client/hooks/useInitialState'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import useCommentSelection from '@/src/client/hooks/useCommentSelection'
import PromptPanel from './promptPanel'
import VersionTimeline from '../versions/versionTimeline'
import TestDataPane from '../testDataPane'
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import useModifiedVersion from '@/src/client/hooks/useModifiedVersion'

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

  const [activeRunID, selectComment] = useCommentSelection(activeVersion, setActiveVersion)

  const [runVersion, partialRuns, isRunning] = useRunVersion(true)
  const runPrompt = (inputs: PromptInputs[]) => runVersion(savePrompt, inputs)

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(inputs)
  }

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    persistInputValuesIfNeeded()
  }

  const [currentVersion, updateVersion] = useModifiedVersion(activeVersion, setModifiedVersion)
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

  const loadPendingVersion = LoadPendingVersion(prompt.versions, activeVersion, setActiveVersion, currentVersion)

  const minWidth = 280
  const minTopPaneHeight = 120
  const [promptHeight, setPromptHeight] = useState(1)
  const minHeight = promptHeight + 2 * 16
  return (
    <Allotment>
      <Allotment.Pane
        key={showComments.toString()}
        className='bg-gray-25'
        minSize={minWidth}
        preferredSize={showComments ? '40%' : '50%'}>
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
            className='z-10 drop-shadow-[0_-4px_14px_rgba(0,0,0,0.03)]'>
            <div className='h-full p-4 bg-white'>
              <PromptPanel
                version={activeVersion}
                setModifiedVersion={updateVersion}
                runPrompt={activeTab === 'Test data' ? testPrompt : runPrompt}
                inputValues={inputValues}
                testConfig={testConfig}
                setTestConfig={setTestConfig}
                loadPendingVersion={loadPendingVersion}
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
