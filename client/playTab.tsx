import { Suspense } from 'react'
import { ActivePrompt, Version, Project } from '@/types'
import VersionTimeline from '@/client/versionTimeline'

import dynamic from 'next/dynamic'
import RunTimeline from './runTimeline'
import { useRunPrompt } from './testTab'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

export default function PlayTab({
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
}: {
  prompt: ActivePrompt
  project: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version?: Version) => void
}) {
  const runPrompt = useRunPrompt(prompt.id)

  return (
    <>
      <div className='flex items-stretch h-full'>
        <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 pr-4 max-w-[50%]'>
          <VersionTimeline
            users={prompt.users}
            versions={prompt.versions}
            project={project}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
          />
          <Suspense>
            <PromptPanel
              key={activeVersion.prompt}
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              onRun={runPrompt}
            />
          </Suspense>
        </div>
        <div className='flex-1 p-6 pl-2'>
          <RunTimeline runs={activeVersion.runs} />
        </div>
      </div>
    </>
  )
}
