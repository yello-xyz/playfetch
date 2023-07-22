import { ReactNode } from 'react'
import { ActivePrompt, Version, InputValues, PromptConfig, PromptInputs, ModelProvider, ActiveProject } from '@/types'

import { ExtractPromptVariables } from '@/src/common/formatting'
import TestDataPane, { EmptyTestDataPane } from './testDataPane'
import VersionSelector from './versionSelector'
import TestButtons from './testButtons'
import PromptPanel from './promptPanel'
import { useInitialState } from './useInitialState'

export default function TestPromptTab({
  prompt,
  project,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  checkProviderAvailable,
  runPrompt,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  maxWidth,
  tabSelector,
}: {
  prompt: ActivePrompt
  project: ActiveProject
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  checkProviderAvailable: (provider: ModelProvider) => boolean
  runPrompt: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  maxWidth: string
  tabSelector: ReactNode
}) {
  const [currentPrompt, setCurrentPrompt] = useInitialState(activeVersion.prompt)

  const updateVersion = (version: Version) => {
    setCurrentPrompt(version.prompt)
    setModifiedVersion(version)
  }

  const variables = ExtractPromptVariables(currentPrompt)

  const selectVersion = (version: Version) => {
    persistInputValuesIfNeeded()
    setActiveVersion(version)
  }

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(activeVersion.config, inputs)
  }

  return (
    <>
      <div className={`flex flex-col justify-between flex-grow h-full gap-4 p-6  ${maxWidth}`}>
        <div className='flex flex-col flex-grow gap-2 overflow-hidden min-h-[50%]'>
          {tabSelector}
          {variables.length > 0 ? (
            <TestDataPane
              variables={variables}
              inputValues={inputValues}
              setInputValues={setInputValues}
              persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            />
          ) : (
            <EmptyTestDataPane />
          )}
        </div>
        <div className='self-start'>
          <VersionSelector
            versions={prompt.versions}
            endpoints={project.endpoints}
            activeVersion={activeVersion}
            setActiveVersion={selectVersion}
          />
        </div>
        <PromptPanel
          version={activeVersion}
          setModifiedVersion={updateVersion}
          checkProviderAvailable={checkProviderAvailable}
        />
        <TestButtons
          variables={variables}
          inputValues={inputValues}
          disabled={!currentPrompt.length}
          callback={testPrompt}
        />
      </div>
    </>
  )
}
