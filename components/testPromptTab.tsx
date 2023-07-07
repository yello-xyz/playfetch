import { Suspense, useState } from 'react'
import { ActivePrompt, Version, InputValues, PromptConfig, PromptInputs } from '@/types'

import dynamic from 'next/dynamic'
import Label from './label'
import { ExtractPromptVariables } from '@/src/common/formatting'
import TestDataPane from './testDataPane'
import VersionSelector from './versionSelector'
import TestButtons from './testButtons'
const PromptPanel = dynamic(() => import('@/components/promptPanel'))

export default function TestPromptTab({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  runPrompt,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  maxWidth,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  runPrompt: (prompt: string, config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  maxWidth: string
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

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(version.prompt, version.config, inputs)
  }

  return (
    <>
      <div className={`flex flex-col justify-between flex-grow h-full gap-4 p-6  ${maxWidth}`}>
        <div className='flex flex-col flex-grow gap-2 overflow-hidden'>
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
            activeVersion={activeVersion}
            setActiveVersion={selectVersion}
          />
        </div>
        <Suspense>
          <PromptPanel version={version} setModifiedVersion={updateVersion} />
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
