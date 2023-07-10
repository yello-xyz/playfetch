import { ActivePrompt, PromptConfig, PromptInputs, ProviderModel, Version } from '@/types'
import VersionTimeline from '@/components/versionTimeline'
import PromptPanel from './promptPanel'

export default function PlayTab({
  prompt,
  activeVersion,
  setActiveVersion,
  setModifiedVersion,
  checkProviderAvailable,
  runPrompt,
  maxWidth,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
  checkProviderAvailable: (provider: ProviderModel) => boolean
  runPrompt: (prompt: string, config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  maxWidth: string
}) {
  return (
    <div className={`flex flex-col justify-between flex-grow h-full gap-4 p-6 ${maxWidth}`}>
      <VersionTimeline prompt={prompt} activeVersion={activeVersion} setActiveVersion={setActiveVersion} />
      <PromptPanel
        version={activeVersion}
        setModifiedVersion={setModifiedVersion}
        checkProviderAvailable={checkProviderAvailable}
        runPrompt={runPrompt}
        inputValues={prompt.inputs}
        showLabel
        />
    </div>
  )
}
