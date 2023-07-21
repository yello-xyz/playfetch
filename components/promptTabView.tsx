import { ActiveProject, ActivePrompt, PartialRun, PromptConfig, PromptInputs, Version } from '@/types'

import PlayTab from './playTab'
import TestPromptTab from './testPromptTab'
import useInputValues from './inputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import api, { StreamReader } from '@/src/client/api'
import useCheckProvider from './checkProvider'

export type MainViewTab = 'play' | 'test'

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
      const { index, message, cost, timestamp, failed } = JSON.parse(data)
      const output = message ?? ''
      const currentIndex = runs.length - 1
      if (index > currentIndex) {
        runs.push({ id: index, output, cost, timestamp, failed })
      } else {
        runs[currentIndex].output += output
        runs[currentIndex].id = index
        runs[currentIndex].cost = cost
        runs[currentIndex].timestamp = timestamp
        runs[currentIndex].failed = failed
      }
    }
    setPartialRuns([...runs])
  }
}

export default function PromptTabView({
  activeTab,
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  showComments,
  setShowComments,
  savePrompt,
}: {
  activeTab: MainViewTab
  prompt: ActivePrompt
  project: ActiveProject
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  savePrompt: () => Promise<number>
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    prompt.inputValues,
    prompt.projectID,
    activeTab
  )

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

  const maxTabWidth = showComments ? 'max-w-[40%]' : 'max-w-[50%]'

  const renderTab = (tab: MainViewTab) => {
    switch (tab) {
      case 'play':
        return (
          <PlayTab
            prompt={prompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            setModifiedVersion={setModifiedVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            maxWidth={maxTabWidth}
          />
        )
      case 'test':
        return (
          <TestPromptTab
            prompt={prompt}
            project={project}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            setModifiedVersion={setModifiedVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            maxWidth={maxTabWidth}
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
