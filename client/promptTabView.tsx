import { Project, ActivePrompt, Version } from '@/types'

import dynamic from 'next/dynamic'
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
          prompt={prompt}
          project={project}
          activeVersion={activeVersion}
          setActiveVersion={setActiveVersion}
          setModifiedVersion={setModifiedVersion}
        />
      )
    case 'publish':
      return (
        <div className='flex items-stretch'>
          <div>
            {project && (
              <PublishPane
                key={activeVersion.id}
                version={activeVersion}
                prompt={prompt}
                project={project}
                endpoint={prompt?.endpoint}
              />
            )}
          </div>
        </div>
      )
  }
}
