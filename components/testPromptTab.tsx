import { ReactNode, useState } from 'react'
import { ActivePrompt, Version, InputValues, PromptConfig, PromptInputs, ModelProvider, ActiveProject } from '@/types'

import { ExtractPromptVariables } from '@/src/common/formatting'
import TestDataPane from './testDataPane'
import VersionSelector from './versionSelector'
import TestButtons from './testButtons'
import PromptPanel from './promptPanel'
import { Allotment } from 'allotment'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'

export default function TestPromptTab({
  currentPrompt,
  currentConfig,
  activeProject,
  activePrompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  checkProviderAvailable,
  runPrompt,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  tabSelector,
}: {
  currentPrompt: string
  currentConfig: PromptConfig
  activeProject: ActiveProject
  activePrompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  checkProviderAvailable: (provider: ModelProvider) => boolean
  runPrompt: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const variables = ExtractPromptVariables(currentPrompt)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  const selectVersion = (version: Version) => {
    persistInputValuesIfNeeded()
    setActiveVersion(version)
  }

  const testPrompt = async (inputs: Record<string, string>[]) => {
    persistInputValuesIfNeeded()
    return runPrompt(currentConfig, inputs)
  }

  const minVersionHeight = 240
  const [promptHeight, setPromptHeight] = useState(1)
  const preferredHeight = promptHeight + 105
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <div className='flex flex-col flex-grow h-full min-h-0 pb-4 overflow-hidden'>
          {tabSelector()}
          <TestDataPane
            variables={variables}
            inputValues={inputValues}
            selectedIndices={selectedIndices}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={Math.min(350, preferredHeight)} preferredSize={preferredHeight}>
        <div className='h-full p-4'>
          <div className='flex flex-col h-full gap-4'>
            <div className='flex gap-2'>
              <VersionSelector
                versions={activePrompt.versions}
                endpoints={activeProject.endpoints}
                activeVersion={activeVersion}
                setActiveVersion={selectVersion}
                labelColors={AvailableLabelColorsForPrompt(activePrompt)}
              />
              {selectedIndices.length > 1 && (
                <div className='flex-grow px-3 py-2 border rounded border-pink-50 bg-pink-25'>
                  Running this prompt will use {selectedIndices.length} rows of test data.
                </div>
              )}
            </div>
            <PromptPanel
              initialPrompt={currentPrompt}
              initialConfig={currentConfig}
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              checkProviderAvailable={checkProviderAvailable}
              onUpdatePreferredHeight={setPromptHeight}
            />
            <TestButtons
              variables={variables}
              inputValues={inputValues}
              disabled={!currentPrompt.length}
              callback={testPrompt}
              onSelectIndices={setSelectedIndices}
            />
          </div>
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
