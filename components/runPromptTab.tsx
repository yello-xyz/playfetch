import { ActivePrompt, InputValues, ModelProvider, PromptConfig, PromptInputs, Version } from '@/types'
import VersionTimeline from '@/components/versionTimeline'
import PromptPanel from './promptPanel'
import { ReactNode, useState } from 'react'
import { Allotment } from 'allotment'

export default function RunPromptTab({
  currentPrompt,
  currentConfig,
  activePrompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  checkProviderAvailable,
  runPrompt,
  inputValues,
  tabSelector,
}: {
  currentPrompt: string
  currentConfig: PromptConfig
  activePrompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  checkProviderAvailable: (provider: ModelProvider) => boolean
  runPrompt: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues: InputValues
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  const minHeight = 230
  const [promptHeight, setPromptHeight] = useState(minHeight)

  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minHeight} preferredSize='50%'>
        <div className='h-full'>
          <VersionTimeline
            prompt={activePrompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            tabSelector={tabSelector}
          />
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={promptHeight} preferredSize={promptHeight}>
        <div className='h-full p-4 bg-white'>
          <PromptPanel
            initialPrompt={currentPrompt}
            initialConfig={currentConfig}
            version={activeVersion}
            setModifiedVersion={setModifiedVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            inputValues={inputValues}
            showLabel
            onUpdatePreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
