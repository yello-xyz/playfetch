import api from '@/client/api'
import { Suspense, useState } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig, Project } from '@/types'

import dynamic from 'next/dynamic'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import Label from './label'
import { ExtractPromptVariables } from '@/common/formatting'
import TextInput from './textInput'
import { PendingButton } from './button'
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
      <div className='flex flex-col gap-2'>
        <Label>Inputs</Label>
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
      <div className='p-8'>
        <div>
          <Suspense>
            <PromptPanel key={version.prompt} version={version} setModifiedVersion={updateVersion} showInputControls />
          </Suspense>
        </div>
      </div>
      <PendingButton
        disabled={!version.prompt.length}
        onClick={() => runPrompt(version.prompt, version.config, [inputs])}>
        {'Run'}
      </PendingButton>
    </>
  )
}
