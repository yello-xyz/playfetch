import { ActivePrompt, Version } from '@/types'

import PlayTab from './playTab'
import PublishPromptTab from './publishPromptTab'
import TestPromptTab from './testPromptTab'
import useInputValues from './inputValues'
import RunTimeline from './runTimeline'
import CommentsPane from './commentsPane'
import { useState } from 'react'

export type MainViewTab = 'play' | 'test' | 'publish'

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

  const sidePanels = (includeRuns: boolean) => (
    <>
      {includeRuns && (
        <div className='flex-1 p-6 pl-0'>
          <RunTimeline runs={activeVersion.runs} version={activeVersion} activeRunID={activeRunID} />
        </div>
      )}
      <CommentsPane
        prompt={prompt}
        onSelectComment={onSelectComment}
        showComments={showComments}
        setShowComments={setShowComments}
      />
    </>
  )

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return (
          <>
            <PlayTab
              prompt={prompt}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              setModifiedVersion={setModifiedVersion}
            />
            {sidePanels(true)}
          </>
        )
      case 'test':
        return (
          <>
            <TestPromptTab
              key={activeVersion.prompt}
              prompt={prompt}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              setModifiedVersion={setModifiedVersion}
              inputValues={inputValues}
              setInputValues={setInputValues}
              persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            />
            {sidePanels(true)}
          </>
        )
      case 'publish':
        return (
          <>
            <PublishPromptTab
              key={activeVersion.id}
              activeVersion={activeVersion}
              setActiveVersion={setActiveVersion}
              prompt={prompt}
            />
            {sidePanels(false)}
          </>
        )
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
