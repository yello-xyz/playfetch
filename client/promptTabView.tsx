import { ActivePrompt, Version } from '@/types'

import PlayTab from './playTab'
import PublishTab from './publishTab'
import TestTab from './testTab'

export type ActivePromptTab = 'play' | 'test' | 'publish'

export default function PromptTabView({
  activeTab,
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
}: {
  activeTab: ActivePromptTab
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
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
          />
        )
      case 'publish':
        return (
          <PublishTab key={activeVersion.id} version={activeVersion} prompt={prompt} endpoints={prompt.endpoints} />
        )
    }
  }
  
  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
