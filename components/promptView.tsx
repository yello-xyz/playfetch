import { ActiveProject, ActivePrompt, PartialRun, PromptConfig, PromptInputs, PromptVersion, TestConfig } from '@/types'

import RunPromptTab from './runPromptTab'
import TestPromptTab from './testPromptTab'
import useInputValues from './useInputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { ReactNode, useState } from 'react'
import { useRefreshActiveItem } from './refreshContext'
import api, { StreamReader } from '@/src/client/api'
import useCheckProvider from './checkProvider'
import TabSelector from './tabSelector'
import useInitialState from './useInitialState'
import { PromptConfigsEqual } from '@/src/common/versionsEqual'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'

export const ConsumeRunStreamReader = async (reader: StreamReader, setPartialRuns: (runs: PartialRun[]) => void) => {
  const runs = {} as { [index: number]: PartialRun }
  setPartialRuns([])
  while (reader) {
    const { done, value } = await reader.read()
    if (done) {
      return
    }
    const text = await new Response(value).text()
    const lines = text.split('\n')
    for (const line of lines.filter(line => line.trim().length > 0)) {
      const data = line.split('data:').slice(-1)[0]
      const { index, message, cost, duration, timestamp, failed } = JSON.parse(data)
      const output = message ?? ''
      if (runs[index]) {
        runs[index].output += output
        runs[index].id = index
        runs[index].cost = cost
        runs[index].duration = duration
        runs[index].timestamp = timestamp
        runs[index].failed = failed
      } else {
        runs[index] = { id: index, output, cost, duration, timestamp, failed }
      }
    }
    setPartialRuns(
      Object.entries(runs)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, run]) => run)
    )
  }
}

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

  const [activeRunID, setActiveRunID] = useState<number>()

  const onSelectComment = (version: PromptVersion, runID?: number) => {
    if (version.id !== activeVersion.id) {
      setActiveRunID(undefined)
      setActiveVersion(version)
      setTimeout(() => setActiveRunID(runID), 1000)
    } else {
      setActiveRunID(runID)
    }
  }

  const refreshActiveItem = useRefreshActiveItem()
  const [isRunning, setRunning] = useState(false)

  const checkProviderAvailable = useCheckProvider()

  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])

  const runPrompt = async (config: PromptConfig, inputs: PromptInputs[]) => {
    if (checkProviderAvailable(config.provider)) {
      setRunning(true)
      const versionID = await savePrompt()
      const streamReader = await api.runPrompt(versionID, inputs)
      await ConsumeRunStreamReader(streamReader, setPartialRuns)
      await refreshActiveItem(versionID)
      setPartialRuns(runs => runs.filter(run => run.failed))
      setRunning(false)
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
            prompt={prompt}
            version={activeVersion}
            activeRunID={activeRunID}
            isRunning={isRunning}
          />
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={showComments ? minWidth : 0} preferredSize={minWidth} visible={showComments}>
        <CommentsPane
          prompt={prompt}
          onSelectComment={onSelectComment}
          showComments={showComments}
          setShowComments={setShowComments}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
