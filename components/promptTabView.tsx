import { ActivePrompt, Version } from '@/types'

import PlayTab from './playTab'
import PublishTab from './publishTab'
import TestTab from './testTab'
import useInputValues from './inputValues'

export type MainViewTab = 'play' | 'test' | 'publish'

export default function PromptTabView({
  activeTab,
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
}: {
  activeTab: MainViewTab
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    prompt.inputs,
    prompt.projectID,
    activeTab
  )

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return (
          <PlayTab
            prompt={prompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            setModifiedVersion={setModifiedVersion}
          />
        )
      case 'test':
        return (
          <TestTab
            key={activeVersion.prompt}
            prompt={prompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            setModifiedVersion={setModifiedVersion}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        )
      case 'publish':
        return (
          <PublishTab
            key={activeVersion.id}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            prompt={prompt}
          />
        )
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
