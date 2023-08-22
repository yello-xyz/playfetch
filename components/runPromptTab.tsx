import { ActivePrompt, InputValues, ModelProvider, PromptConfig, PromptInputs, TestConfig, Version } from '@/types'
import VersionTimeline from '@/components/versionTimeline'
import PromptPanel from './promptPanel'
import { ReactNode, useState } from 'react'
import { Allotment } from 'allotment'

export default function RunPromptTab({
  currentPrompt,
  currentPromptConfig,
  activePrompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  checkProviderAvailable,
  runPrompt,
  inputValues,
  testConfig,
  tabSelector,
}: {
  currentPrompt: string
  currentPromptConfig: PromptConfig
  activePrompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  checkProviderAvailable: (provider: ModelProvider) => boolean
  runPrompt: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  testConfig: TestConfig
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const minVersionHeight = 230
  const [promptHeight, setPromptHeight] = useState(1)
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <div className='h-full'>
          <VersionTimeline
            prompt={activePrompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            tabSelector={tabSelector}
          />
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={Math.min(350, promptHeight)} preferredSize={promptHeight}>
        <div className='h-full p-4 bg-white'>
          <PromptPanel
            initialPrompt={currentPrompt}
            initialConfig={currentPromptConfig}
            version={activeVersion}
            setModifiedVersion={setModifiedVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            inputValues={inputValues}
            testConfig={testConfig}
            showLabel
            onUpdatePreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
