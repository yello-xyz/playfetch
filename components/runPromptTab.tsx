import {
  ActivePrompt,
  InputValues,
  PromptConfig,
  PromptInputs,
  TestConfig,
  PromptVersion,
} from '@/types'
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
  runPrompt,
  inputValues,
  testConfig,
  setTestConfig,
  tabSelector,
}: {
  currentPrompt: string
  currentPromptConfig: PromptConfig
  activePrompt: ActivePrompt
  activeVersion: PromptVersion
  setActiveVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  runPrompt: (inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
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
            runPrompt={runPrompt}
            inputValues={inputValues}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            showLabel
            onUpdatePreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
