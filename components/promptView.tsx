import { ActiveProject, ActivePrompt, PartialRun, PromptConfig, PromptInputs, Version } from '@/types'

import RunPromptTab from './runPromptTab'
import TestPromptTab from './testPromptTab'
import useInputValues from './useInputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { ReactNode, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import api, { StreamReader } from '@/src/client/api'
import useCheckProvider from './checkProvider'
import TabSelector from './tabSelector'
import { useInitialState } from './useInitialState'
import { ConfigsEqual } from '@/src/common/versionsEqual'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'

export const ConsumeRunStreamReader = async (reader: StreamReader, setPartialRuns: (runs: PartialRun[]) => void) => {
  const runs = [] as PartialRun[]
  setPartialRuns(runs)
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
      const currentIndex = runs.length - 1
      if (index > currentIndex) {
        runs.push({ id: index, output, cost, duration, timestamp, failed })
      } else {
        runs[currentIndex].output += output
        runs[currentIndex].id = index
        runs[currentIndex].cost = cost
        runs[currentIndex].duration = duration
        runs[currentIndex].timestamp = timestamp
        runs[currentIndex].failed = failed
      }
    }
    setPartialRuns([...runs])
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
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  savePrompt: () => Promise<number>
}) {
  type ActiveTab = 'Prompt versions' | 'Test data'
  const [activeTab, setActiveTab] = useState<ActiveTab>('Prompt versions')
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(prompt, activeTab)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  const [currentPrompt, setCurrentPrompt] = useInitialState(activeVersion.prompt)
  const [currentConfig, setCurrentConfig] = useInitialState(activeVersion.config, ConfigsEqual)

  const updateVersion = (version: Version) => {
    setCurrentPrompt(version.prompt)
    setCurrentConfig(version.config)
    setModifiedVersion(version)
  }

  const [activeRunID, setActiveRunID] = useState<number>()

  const onSelectComment = (version: Version, runID?: number) => {
    if (version.id !== activeVersion.id) {
      setActiveRunID(undefined)
      setActiveVersion(version)
      setTimeout(() => setActiveRunID(runID), 1000)
    } else {
      setActiveRunID(runID)
    }
  }

  const refreshPrompt = useRefreshPrompt()
  const [isRunning, setRunning] = useState(false)

  const checkProviderAvailable = useCheckProvider()

  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])

  const runPrompt = async (config: PromptConfig, inputs: PromptInputs[]) => {
    if (checkProviderAvailable(config.provider)) {
      setRunning(true)
      const versionID = await savePrompt()
      const streamReader = await api.runPrompt({ versionID }, inputs)
      await ConsumeRunStreamReader(streamReader, setPartialRuns)
      await refreshPrompt(versionID)
      setPartialRuns(runs => runs.filter(run => run.failed))
      setRunning(false)
    }
  }

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    persistInputValuesIfNeeded()
  }

  const showTestData = ExtractPromptVariables(currentPrompt).length > 0 || Object.keys(prompt.inputValues).length > 0
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
            currentConfig={currentConfig}
            activePrompt={prompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            setModifiedVersion={updateVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            inputValues={inputValues}
            tabSelector={tabSelector}
          />
        )
      case 'Test data':
        return (
          <TestPromptTab
            currentPrompt={currentPrompt}
            currentConfig={currentConfig}
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
            selectedIndices={selectedIndices}
            setSelectedIndices={setSelectedIndices}
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
