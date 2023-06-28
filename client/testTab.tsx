import api from '@/client/api'
import { Suspense } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig, Project, User } from '@/types'

import dynamic from 'next/dynamic'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

export const useRunPrompt =
  (promptID: number) => async (currentPrompt: string, config: PromptConfig, inputs: PromptInputs[]) => {
    const savePrompt = useSavePrompt()
    const refreshPrompt = useRefreshPrompt()

    const versionID = await savePrompt()
    await refreshPrompt(versionID)
    await api.runPrompt(promptID, versionID, currentPrompt, config, inputs).then(_ => refreshPrompt(versionID))
  }

export default function TestTab({
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
  return (
    <>
      <div className='p-8'>
        <div>
          <Suspense>
            <PromptPanel
              key={activeVersion.prompt}
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              showInputControls
            />
          </Suspense>
        </div>
      </div>
    </>
  )
}
