import { Suspense } from 'react'
import { ActivePrompt, Version } from '@/types'
import VersionTimeline from '@/components/versionTimeline'

import dynamic from 'next/dynamic'
import { useRunPrompt } from './testPromptTab'
const PromptPanel = dynamic(() => import('@/components/promptPanel'))

export default function PlayTab({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  maxWidth,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  maxWidth: string
}) {
  const runPrompt = useRunPrompt(prompt.id)

  return (
    <>
      <div className={`flex flex-col justify-between flex-grow h-full gap-4 p-6 ${maxWidth}`}>
        <VersionTimeline prompt={prompt} activeVersion={activeVersion} setActiveVersion={setActiveVersion} />
        <Suspense>
          <PromptPanel
            key={activeVersion.prompt}
            version={activeVersion}
            setModifiedVersion={setModifiedVersion}
            onRun={runPrompt}
            inputValues={prompt.inputs}
            showLabel
          />
        </Suspense>
      </div>
    </>
  )
}
