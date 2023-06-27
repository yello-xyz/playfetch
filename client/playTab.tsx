import api from '@/client/api'
import { Suspense } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig, Project, User } from '@/types'
import VersionTimeline from '@/client/versionTimeline'

import dynamic from 'next/dynamic'
import RunTimeline from './runTimeline'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
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
  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()

  const selectActiveVersion = (version: Version) => {
    if (version.id !== activeVersion.id) {
      savePrompt().then(() => refreshPrompt(version.id))
      setActiveVersion(version)
    }
  }

  const runPrompt = async (currentPrompt: string, config: PromptConfig, inputs: PromptInputs) => {
    const versionID = await savePrompt()
    await refreshPrompt(versionID)
    await api.runPrompt(prompt.id, versionID, currentPrompt, config, inputs).then(_ => refreshPrompt(versionID))
  }

  return (
    <>
      <div className='flex items-stretch h-full'>
        <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 pr-4 max-w-prose'>
          <VersionTimeline
            users={prompt.users}
            versions={prompt.versions}
            project={project}
            activeVersion={activeVersion}
            setActiveVersion={selectActiveVersion}
          />
          <Suspense>
            <PromptPanel
              key={activeVersion.id}
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
