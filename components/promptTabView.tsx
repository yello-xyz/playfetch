import { ActivePrompt, PromptConfig, PromptInputs, Version } from '@/types'

import PlayTab from './playTab'
import PublishPromptTab from './publishPromptTab'
import TestPromptTab from './testPromptTab'
import useInputValues from './inputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { useState } from 'react'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import api from '@/src/client/api'

export type MainViewTab = 'play' | 'test' | 'publish'

export default function PromptTabView({
  activeTab,
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  showComments,
  setShowComments,
  onSelectSettings,
}: {
  activeTab: MainViewTab
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  onSelectSettings: () => void
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

  const runPrompt = async (prompt: string, config: PromptConfig, inputs: PromptInputs[]) => {
    setRunning(true)
    const versionID = await savePrompt()
    await refreshPrompt(versionID)
    await api.runPrompt({ promptID, versionID, prompt, config }, inputs).then(_ => refreshPrompt(versionID))
    setRunning(false)
  }

  const checkProviderAvailable = (provider: PromptConfig['provider']) => {
    if (prompt.availableProviders.includes(provider)) {
      return true
    } else {
      onSelectSettings()
      return false
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
