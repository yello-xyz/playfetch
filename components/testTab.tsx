import api from '@/src/client/api'
import { Suspense, useState } from 'react'
import { ActivePrompt, Version, PromptInputs, PromptConfig } from '@/types'

import dynamic from 'next/dynamic'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import Label from './label'
import { ExtractPromptVariables } from '@/src/common/formatting'
import RunTimeline from './runTimeline'
import TestDataPane from './testDataPane'
import VersionSelector from './versionSelector'
import TestButtons from './testButtons'
const PromptPanel = dynamic(() => import('@/components/promptPanel'))

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
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const [version, setVersion] = useState(activeVersion)
  const updateVersion = (version: Version) => {
    setVersion(version)
    setModifiedVersion(version)
  }
  const selectVersion = (version: Version) => {
    persistValuesIfNeeded()
    setVersion(version)
    setActiveVersion(version)
  }

  const originalInputs = Object.fromEntries(prompt.inputs.map(input => [input.name, input.values]))
  const variables = ExtractPromptVariables(version.prompt)
  const [inputValues, setInputValues] = useState(originalInputs)
  
  // TODO this should also be persisted when switching tabs
  const persistValuesIfNeeded = () => {
    for (const [variable, inputs] of Object.entries(inputValues)) {
      if (inputs.join(',') !== (originalInputs[variable] ?? []).join(',')) {
        api.updateInputValues(prompt.projectID, variable, inputs)
      }
    }
  }

  const runPrompt = useRunPrompt(prompt.id)
  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistValuesIfNeeded()
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
            onPersistInputValues={persistValuesIfNeeded}
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
      <div className='flex-1 p-6 pl-0'>
        <RunTimeline runs={activeVersion.runs} />
      </div>
    </>
  )
}
