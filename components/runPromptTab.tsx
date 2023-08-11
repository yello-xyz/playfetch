import { ActivePrompt, InputValues, ModelProvider, PromptConfig, PromptInputs, Version } from '@/types'
import VersionTimeline from '@/components/versionTimeline'
import PromptPanel from './promptPanel'
import { ReactNode } from 'react'
import { Allotment } from 'allotment'
import 'allotment/dist/style.css'

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
  tabSelector: ReactNode
}) {
  const minHeight = 230
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minHeight} preferredSize='50%'>
        <div className='h-full p-6'>
          <VersionTimeline
            prompt={activePrompt}
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            tabSelector={tabSelector}
          />
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={minHeight}>
        <div className='h-full p-6'>
          <PromptPanel
            initialPrompt={currentPrompt}
            initialConfig={currentConfig}
            version={activeVersion}
            setModifiedVersion={setModifiedVersion}
            checkProviderAvailable={checkProviderAvailable}
            runPrompt={runPrompt}
            inputValues={inputValues}
            showLabel
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
