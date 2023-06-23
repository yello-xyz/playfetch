import api from '@/client/api'
import { Suspense } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig, Project } from '@/types'
import VersionTimeline from '@/client/versionTimeline'

import dynamic from 'next/dynamic'
import RunTimeline from './runTimeline'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

export default function PlayTab({
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setDirtyVersion,
  onSavePrompt,
  onRefreshPrompt,
}: {
  prompt: ActivePrompt
  project?: Project
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setDirtyVersion: (version?: Version) => void
  onSavePrompt: (onSaved?: (versionID: number) => void) => Promise<number>
  onRefreshPrompt: (focusVersionID?: number) => void
}) {
  const selectActiveVersion = (version: Version) => {
    if (version.id !== activeVersion.id) {
      onSavePrompt(_ => onRefreshPrompt())
      setActiveVersion(version)
    }
  }

  const runPrompt = async (currentPrompt: string, config: PromptConfig, inputs: PromptInputs) => {
    const versionID = await onSavePrompt(versionID => onRefreshPrompt(versionID))
    await api.runPrompt(prompt.id, versionID, currentPrompt, config, inputs).then(_ => onRefreshPrompt(versionID))
  }

  return (
    <>
      <div className='flex items-stretch h-full'>
        <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 pr-4 max-w-prose'>
          <VersionTimeline
            versions={prompt.versions}
            project={project}
            activeVersion={activeVersion}
            setActiveVersion={selectActiveVersion}
            onRefreshPrompt={onRefreshPrompt}
          />
          <Suspense>
            <PromptPanel
              key={activeVersion.id}
              version={activeVersion}
              setDirtyVersion={setDirtyVersion}
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
