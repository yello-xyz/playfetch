import { useState } from 'react'
import { InputValues, PromptConfig, PromptInputs, ModelProvider, Version, LanguageModel } from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import PromptSettingsPane from './promptSettingsPane'
import { PendingButton } from './button'
import ModelSelector, { ProviderForModel } from './modelSelector'
import { ConfigsEqual } from '@/src/common/versionsEqual'
import RichTextInput from './richTextInput'
import { useInitialState } from './useInitialState'

export default function PromptPanel({
  initialPrompt,
  initialConfig,
  version,
  setModifiedVersion,
  runPrompt,
  inputValues,
  showLabel,
  checkProviderAvailable,
}: {
  initialPrompt?: string
  initialConfig?: PromptConfig
  version: Version
  setModifiedVersion: (version: Version) => void
  runPrompt?: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues?: InputValues
  showLabel?: boolean
  checkProviderAvailable: (provider: ModelProvider) => boolean
}) {
  const [prompt, setPrompt] = useInitialState(initialPrompt !== undefined ? initialPrompt : version.prompt)
  const [config, setConfig] = useInitialState(
    initialConfig !== undefined ? initialConfig : version.config,
    ConfigsEqual
  )

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
    <div className='flex flex-col h-full min-h-0 gap-4 text-gray-500 bg-white'>
      <div className='self-stretch flex-1 min-h-0'>
        <RichTextInput
          key={version.id}
          value={prompt}
          setValue={updatePrompt}
          label={showLabel ? 'Prompt' : undefined}
          placeholder='Enter prompt here. Use {{variable}} to insert dynamic values.'
        />
      </div>
      {runPrompt && <PromptSettingsPane config={config} setConfig={updateConfig} />}
      {runPrompt && (
        <div className='flex items-center self-end gap-3'>
          <ModelSelector model={config.model} setModel={updateModel} />
          <PendingButton disabled={!prompt.length} onClick={() => runPrompt(config, [inputs])}>
            {version.runs.length ? 'Run again' : 'Run'}
          </PendingButton>
        </div>
      )}
    </div>
  )
}
