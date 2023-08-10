import { ActivePrompt, InputValues, ModelProvider, PromptConfig, PromptInputs, Version } from '@/types'
import VersionTimeline from '@/components/versionTimeline'
import PromptPanel from './promptPanel'
import { ReactNode } from 'react'

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
  maxWidth,
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
  maxWidth: string
  tabSelector: ReactNode
}) {
  return (
    <div className={`flex flex-col justify-between flex-grow h-full gap-4 p-6 ${maxWidth}`}>
      <VersionTimeline
        prompt={activePrompt}
        activeVersion={activeVersion}
        setActiveVersion={setActiveVersion}
        tabSelector={tabSelector}
      />
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
  )
}
