import { ActiveProject, ActivePrompt, PartialRun, PromptConfig, PromptInputs, Version } from '@/types'

import RunPromptTab from './runPromptTab'
import TestPromptTab from './testPromptTab'
import useInputValues from './inputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import api, { StreamReader } from '@/src/client/api'
import useCheckProvider from './checkProvider'
import TabSelector, { TabButton } from './tabSelector'
import { useInitialState } from './useInitialState'
import { ConfigsEqual } from '@/src/common/versionsEqual'

export const ConsumeRunStreamReader = async (reader: StreamReader, setPartialRuns: (runs: PartialRun[]) => void) => {
  const runs = [] as PartialRun[]
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

type ActiveTab = 'versions' | 'testdata'

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('versions')

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    project.inputValues,
    project.id,
    activeTab
  )

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
      setPartialRuns([])
      setRunning(false)
    }
  }

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    persistInputValuesIfNeeded()
  }

  const maxTabWidth = showComments ? 'max-w-[40%]' : 'max-w-[50%]'
  const tabSelector = (
    <TabSelector>
      <TabButton title='Prompt versions' tab='versions' activeTab={activeTab} setActiveTab={selectTab} />
      <TabButton title='Test data' tab='testdata' activeTab={activeTab} setActiveTab={selectTab} />
    </TabSelector>
  )

  const renderTab = (tab: ActiveTab) => {
    switch (tab) {
      case 'versions':
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
            maxWidth={maxTabWidth}
            tabSelector={tabSelector}
          />
        )
      case 'testdata':
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
            maxWidth={maxTabWidth}
            tabSelector={tabSelector}
          />
        )
    }
  }

  return (
    <div className='flex items-stretch h-full'>
      {renderTab(activeTab)}
      <div className='flex-1 p-6 pl-0'>
        <RunTimeline
          runs={[...activeVersion.runs, ...partialRuns]}
          prompt={prompt}
          version={activeVersion}
          activeRunID={activeRunID}
          isRunning={isRunning}
        />
      </div>
      <CommentsPane
        prompt={prompt}
        onSelectComment={onSelectComment}
        showComments={showComments}
        setShowComments={setShowComments}
      />
    </div>
  )
}
