import { useState } from 'react'
import { InputValues, PromptConfig, PromptInputs, ModelProvider, Version, LanguageModel } from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import PromptSettingsPane from './promptSettingsPane'
import { PendingButton } from './button'
import ModelSelector, { ProviderForModel } from './modelSelector'
import { VersionsEqual } from '@/src/common/versionsEqual'
import RichTextInput from './richTextInput'

export default function PromptPanel({
  version,
  setModifiedVersion,
  runPrompt,
  inputValues,
  showLabel,
  checkProviderAvailable,
}: {
  version: Version
  setModifiedVersion: (version: Version) => void
  runPrompt?: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues?: InputValues
  showLabel?: boolean
  checkProviderAvailable: (provider: ModelProvider) => boolean
}) {
  const [prompt, setPrompt] = useState(version.prompt)
  const [config, setConfig] = useState(version.config)

  const [savedVersion, setSavedVersion] = useState(version)
  if (!VersionsEqual(version, savedVersion)) {
    setPrompt(version.prompt)
    setConfig(version.config)
    setSavedVersion(version)
  }

  const update = (prompt: string, config: PromptConfig) => {
    setPrompt(prompt)
    setConfig(config)
    setModifiedVersion({ ...version, prompt, config })
  }

  const updatePrompt = (prompt: string) => update(prompt, config)
  const updateConfig = (config: PromptConfig) => update(prompt, config)
  const updateModel = (model: LanguageModel) => {
    const provider = ProviderForModel(model)
    if (checkProviderAvailable(provider)) {
      updateConfig({ ...config, provider, model })
    }
  }

  // In the play tab, we resolve each variable with any available input and otherwise let it stand for itself.
  const inputs = Object.fromEntries(
    ExtractPromptVariables(prompt).map(variable => [variable, inputValues?.[variable]?.[0] ?? variable])
  )

  return (
    <div className='flex flex-col min-h-0 gap-4 text-gray-500'>
      <div className='self-stretch min-h-0'>
        <RichTextInput
          key={version.id}
          value={prompt}
          setValue={updatePrompt}
          label={showLabel ? 'Prompt' : undefined}
        />
      </div>
      {runPrompt && <PromptSettingsPane config={config} setConfig={updateConfig} />}
      {runPrompt && (
        <div className='flex items-center self-end gap-4'>
          <ModelSelector model={config.model} setModel={updateModel} />
          <PendingButton disabled={!prompt.length} onClick={() => runPrompt(config, [inputs])}>
            {version.runs.length ? 'Run again' : 'Run'}
          </PendingButton>
        </div>
      )}
    </div>
  )
}
