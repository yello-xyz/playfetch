import api from '@/client/api'
import { Suspense } from 'react'
import { Project, ActivePrompt, Version } from '@/types'

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
  setDirtyVersion,
  onSavePrompt,
}: {
  activeTab: ActivePromptTab
  prompt: ActivePrompt
  project?: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setDirtyVersion: (version?: Version) => void
  onSavePrompt: (onSaved?: (versionID: number) => void) => Promise<number>
}) {
  switch (activeTab) {
    case 'play':
      return (
        <PlayTab
          prompt={prompt}
          project={project}
          activeVersion={activeVersion}
          setActiveVersion={setActiveVersion}
          setDirtyVersion={setDirtyVersion}
          onSavePrompt={onSavePrompt}
        />
      )
    case 'test':
      return (
        <div className='p-8'>
          <div>
            <Suspense>
              <PromptPanel
                key={activeVersion.id}
                version={activeVersion}
                setDirtyVersion={setDirtyVersion}
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
                endpointNameValidator={(name: string) => api.checkEndpointName(prompt.id, project!.urlPath, name)}
                onSavePrompt={() => onSavePrompt().then()}
              />
            )}
          </div>
        </div>
      )
  }
}
