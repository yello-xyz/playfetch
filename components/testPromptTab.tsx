import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig, InputValues } from '@/types'

import dynamic from 'next/dynamic'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import Label from './label'
import { ExtractPromptVariables } from '@/src/common/formatting'
import TestDataPane from './testDataPane'
import VersionSelector from './versionSelector'
import TestButtons from './testButtons'
const PromptPanel = dynamic(() => import('@/components/promptPanel'))

export const useRunPrompt = (promptID: number) => {
  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()

  return async (prompt: string, config: PromptConfig, inputs: PromptInputs[]) => {
    const versionID = await savePrompt()
    await refreshPrompt(versionID)
    await api.runPrompt({ promptID, versionID, prompt, config }, inputs).then(_ => refreshPrompt(versionID))
  }
}

export default function TestPromptTab({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
}) {
  const [version, setVersion] = useState(activeVersion)
  const updateVersion = (version: Version) => {
    setVersion(version)
    setModifiedVersion(version)
  }

  const variables = ExtractPromptVariables(version.prompt)

  const selectVersion = (version: Version) => {
    persistInputValuesIfNeeded()
    setVersion(version)
    setActiveVersion(version)
  }

  const runPrompt = useRunPrompt(prompt.id)
  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(version.prompt, version.config, inputs)
  }

  return (
    <>
      <div className='flex flex-col justify-between flex-grow h-full gap-4 p-6 max-w-[50%]'>
        <div className='flex flex-col flex-grow gap-2'>
          <Label>Test Data</Label>
          <TestDataPane
            variables={variables}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        </div>
        <div className='self-start'>
          <VersionSelector
            versions={prompt.versions}
            endpoints={prompt.endpoints}
            activeVersion={version}
            setActiveVersion={selectVersion}
          />
        </div>
        <Suspense>
          <PromptPanel
            key={activeVersion.prompt}
            version={version}
            setModifiedVersion={updateVersion}
            showInputControls
          />
        </Suspense>
        <TestButtons
          variables={variables}
          inputValues={inputValues}
          disabled={!version.prompt.length}
          callback={testPrompt}
        />
      </div>
    </>
  )
}
