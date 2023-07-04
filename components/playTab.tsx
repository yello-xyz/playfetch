import { Suspense } from 'react'
import { ActivePrompt, Version, Project } from '@/types'
import VersionTimeline from '@/components/versionTimeline'

import dynamic from 'next/dynamic'
import RunTimeline from './runTimeline'
import { useRunPrompt } from './testPromptTab'
const PromptPanel = dynamic(() => import('@/components/promptPanel'))

export default function PlayTab({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const runPrompt = useRunPrompt(prompt.id)

  return (
    <>
      <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 max-w-[50%]'>
        <VersionTimeline prompt={prompt} activeVersion={activeVersion} setActiveVersion={setActiveVersion} />
        <Suspense>
          <PromptPanel
            key={activeVersion.prompt}
            version={activeVersion}
            setModifiedVersion={setModifiedVersion}
            onRun={runPrompt}
            showLabel
          />
        </Suspense>
      </div>
      <div className='flex-1 p-6 pl-0'>
        <RunTimeline runs={activeVersion.runs} />
      </div>
    </>
  )
}
