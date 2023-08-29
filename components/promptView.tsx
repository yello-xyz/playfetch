import { ActiveProject, ActivePrompt, PromptConfig, PromptInputs, PromptVersion, TestConfig } from '@/types'

import RunPromptTab from './runPromptTab'
import TestPromptTab from './testPromptTab'
import useInputValues from '@/src/client/hooks/useInputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { ReactNode, useState } from 'react'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import TabSelector from './tabSelector'
import useInitialState from '@/src/client/hooks/useInitialState'
import { PromptConfigsEqual } from '@/src/common/versionsEqual'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'
import useRunVersion from '@/src/client/hooks/useRunVersion'
import useCommentSelection from '@/src/client/hooks/useCommentSelection'

export default function PromptView({
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  showComments,
  setShowComments,
  savePrompt,
}: {
  prompt: ActivePrompt
  project: ActiveProject
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

  const [currentPrompt, setCurrentPrompt] = useInitialState(activeVersion.prompt)
  const [currentPromptConfig, setCurrentPromptConfig] = useInitialState(activeVersion.config, PromptConfigsEqual)

  const updateVersion = (version: PromptVersion) => {
    setCurrentPrompt(version.prompt)
    setCurrentPromptConfig(version.config)
    setModifiedVersion(version)
  }

  const [activeRunID, selectComment] = useCommentSelection(activeVersion, setActiveVersion)

  const checkProviderAvailable = useCheckProvider()

  const [runVersion, partialRuns, isRunning] = useRunVersion()
  const runPrompt = async (config: PromptConfig, inputs: PromptInputs[]) => {
    if (checkProviderAvailable(config.provider)) {
      await runVersion(savePrompt, inputs)
    }
  }

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    persistInputValuesIfNeeded()
  }

  const variables = ExtractPromptVariables(currentPrompt)
  const showTestData = variables.length > 0 || Object.keys(prompt.inputValues).length > 0
  const tabSelector = (children?: ReactNode) => (
    <TabSelector
      tabs={showTestData ? ['Prompt versions', 'Test data'] : ['Prompt versions']}
      activeTab={activeTab}
      setActiveTab={selectTab}>
      {children}
    </TabSelector>
  )

  if (activeTab === 'Test data' && !showTestData) {
    setActiveTab('Prompt versions')
  }

  const renderTab = (tab: ActiveTab) => {
    switch (tab) {
      case 'Prompt versions':
        return (
          <RunPromptTab
            currentPrompt={currentPrompt}
            currentPromptConfig={currentPromptConfig}
            activePrompt={prompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            setModifiedVersion={updateVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            inputValues={inputValues}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            tabSelector={tabSelector}
          />
        )
      case 'Test data':
        return (
          <TestPromptTab
            currentPrompt={currentPrompt}
            currentPromptConfig={currentPromptConfig}
            activeProject={project}
            activePrompt={prompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            setModifiedVersion={updateVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            tabSelector={tabSelector}
          />
        )
    }
  }

  const minWidth = 280
  return (
    <Allotment>
      <Allotment.Pane className='bg-gray-25' minSize={minWidth} preferredSize='50%'>
        {renderTab(activeTab)}
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
