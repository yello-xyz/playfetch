import api from '@/client/api'
import { Suspense, useState } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig, Project } from '@/types'
import chevronIcon from '@/public/chevron.svg'

import dynamic from 'next/dynamic'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import Label from './label'
import { ExtractPromptVariables } from '@/common/formatting'
import TextInput from './textInput'
import { PendingButton } from './button'
import RunTimeline from './runTimeline'
import PopupMenu, { PopupMenuItem } from './popupMenu'
const PromptPanel = dynamic(() => import('@/client/promptPanel'))

export const useRunPrompt = (promptID: number) => {
  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()

  return async (currentPrompt: string, config: PromptConfig, inputs: PromptInputs[]) => {
    const versionID = await savePrompt()
    await refreshPrompt(versionID)
    await api.runPrompt(promptID, versionID, currentPrompt, config, inputs).then(_ => refreshPrompt(versionID))
  }
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
  setModifiedVersion: (version: Version) => void
}) {
  const [version, setVersion] = useState(activeVersion)
  const updateVersion = (version: Version) => {
    setVersion(version)
    setModifiedVersion(version)
  }

  const runPrompt = useRunPrompt(prompt.id)
  const lastRun = version.runs.slice(-1)[0]
  const [inputState, setInputState] = useState<{ [key: string]: string }>(lastRun?.inputs ?? {})
  const inputVariables = ExtractPromptVariables(version.prompt)
  const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

  return (
    <>
      <div className='flex items-stretch h-full'>
        <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 max-w-[50%]'>
          <div className='flex flex-col flex-grow gap-2'>
            <Label>Test Data</Label>
            {inputVariables.map((variable, index) => (
              <div key={index} className='flex gap-2'>
                <Label htmlFor={variable} className='flex-1'>
                  {variable}
                </Label>
                <TextInput
                  value={inputState[variable] ?? ''}
                  setValue={value => setInputState({ ...inputState, [variable]: value })}
                  id={variable}
                />
              </div>
            ))}
          </div>
          <VersionSelector versions={prompt.versions} activeVersion={version} setActiveVersion={setVersion} />
          <Suspense>
            <PromptPanel key={version.prompt} version={version} setModifiedVersion={updateVersion} showInputControls />
          </Suspense>
          <div className='self-end'>
            <PendingButton
              disabled={!version.prompt.length}
              onClick={() => runPrompt(version.prompt, version.config, [inputs])}>
              {'Run'}
            </PendingButton>
          </div>
        </div>
        <div className='flex-1 p-6 pl-0'>
          <RunTimeline runs={activeVersion.runs} />
        </div>
      </div>
    </>
  )
}

function VersionSelector({
  versions,
  activeVersion,
  setActiveVersion,
}: {
  versions: Version[]
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const ascendingVersions = versions.slice().reverse()
  const index = ascendingVersions.findIndex(version => version.id === activeVersion.id)
  const selectVersion = (version: Version) => {
    setIsMenuExpanded(false)
    setActiveVersion(version)
  }

  return (
    <div className='relative flex items-end cursor-pointer' onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
      <div className='flex items-center'>
        <Label className='cursor-pointer'>{`Prompt ${index + 1}`}</Label>
        <img className='w-6 h-6' src={chevronIcon.src} />
      </div>
      <div className=''>
        <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
          {ascendingVersions.map((version, index) => (
            <PopupMenuItem title={`Prompt ${index + 1}`} callback={() => selectVersion(version)} />
          ))}
        </PopupMenu>
      </div>
    </div>
  )
}
