import { ActivePrompt, PromptConfig, PromptInputs, ModelProvider, Version, RunConfig } from '@/types'

import PlayTab from './playTab'
import PublishPromptTab from './publishPromptTab'
import TestPromptTab from './testPromptTab'
import useInputValues from './inputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { useState } from 'react'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import api from '@/src/client/api'
import { useLoggedInUser } from './userContext'

export type MainViewTab = 'play' | 'test' | 'publish'

const streamPrompt = async (
  runConfig: RunConfig,
  inputs: PromptInputs[],
  setPartialRuns: (runs: string[]) => void
) => {
  const reader = await api.runPrompt(runConfig, inputs)
  const runs = ['']
  while (reader) {
    const { done, value } = await reader.read()
    if (done) {
      return
    }
    const text = await new Response(value).text()
    const [runIndex, runText] = text.split(':')
    const currentIndex = runs.length - 1
    if (Number(runIndex) === currentIndex) {
      runs[currentIndex] += runText
    } else {
      runs.push(runText)
    }
    setPartialRuns([...runs])
  }
}

export default function PromptTabView({
  activeTab,
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  showComments,
  setShowComments,
}: {
  activeTab: MainViewTab
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  showComments: boolean
  setShowComments: (show: boolean) => void
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    prompt.inputs,
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

  const promptID = prompt.id
  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()
  const [isRunning, setRunning] = useState(false)

  const user = useLoggedInUser()

  const checkProviderAvailable = (provider: ModelProvider) => {
    if (user.availableProviders.find(p => p.provider === provider)) {
      return true
    } else {
      user.showSettings()
      return false
    }
  }

  const [partialRuns, setPartialRuns] = useState<string[]>([])

  const runPrompt = async (prompt: string, config: PromptConfig, inputs: PromptInputs[]) => {
    if (checkProviderAvailable(config.provider)) {
      setRunning(true)
      const versionID = await savePrompt()
      await refreshPrompt(versionID)
      await streamPrompt({ promptID, versionID, prompt, config }, inputs, setPartialRuns)
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
      case 'publish':
        return (
          <PublishPromptTab
            key={activeVersion.id}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            prompt={prompt}
            maxWidth={maxTabWidth}
          />
        )
    }
  }

  return (
    <div className='flex items-stretch h-full'>
      {renderTab(activeTab)}
      {activeTab !== 'publish' && (
        <div className='flex-1 p-6 pl-0'>
          <RunTimeline
            runs={activeVersion.runs}
            prompt={prompt}
            version={activeVersion}
            activeRunID={activeRunID}
            isRunning={isRunning}
            partialRuns={partialRuns}
          />
        </div>
      )}
      <CommentsPane
        prompt={prompt}
        onSelectComment={onSelectComment}
        showComments={showComments}
        setShowComments={setShowComments}
      />
    </div>
  )
}
