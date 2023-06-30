import { Project, ActivePrompt, Version } from '@/types'

import PlayTab from './playTab'
import PublishPane from './publishPane'
import TestTab from './testTab'

export type ActivePromptTab = 'play' | 'test' | 'publish'

export default function PromptTabView({
  activeTab,
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
}: {
  activeTab: ActivePromptTab
  prompt: ActivePrompt
  project: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  switch (activeTab) {
    case 'play':
      return (
        <PlayTab
          prompt={prompt}
          project={project}
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
        <div className='flex items-stretch'>
          <div>
            {prompt.availableFlavors.length > 0 && (
              <PublishPane
                key={activeVersion.id}
                version={activeVersion}
                prompt={prompt}
                endpoints={prompt.endpoints}
              />
            )}
          </div>
        </div>
      )
  }
}
