import { Suspense } from 'react'
import { Project, ActivePrompt, Version, User } from '@/types'

import dynamic from 'next/dynamic'
import PlayTab from './playTab'
import PublishPane from './publishPane'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

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
  setModifiedVersion: (version?: Version) => void
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
        <div className='p-8'>
          <div>
            <Suspense>
              <PromptPanel
                key={activeVersion.prompt}
                version={activeVersion}
                setModifiedVersion={setModifiedVersion}
                showInputs
              />
            </Suspense>
          </div>
        </div>
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
