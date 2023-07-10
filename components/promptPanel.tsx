import { Suspense, useState } from 'react'
import { InputValues, PromptConfig, PromptInputs, ModelProvider, Version } from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import PromptSettingsPane from './promptSettingsPane'
import { PendingButton } from './button'

import dynamic from 'next/dynamic'
import ProviderSelector from './providerSelector'
const PromptInput = dynamic(() => import('./promptInput'))

export default function PromptPanel({
  version,
  setModifiedVersion,
  runPrompt,
  inputValues = {},
  showLabel,
  checkProviderAvailable,
}: {
  version: Version
  setModifiedVersion: (version: Version) => void
  runPrompt?: (prompt: string, config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues?: InputValues
  showLabel?: boolean
  checkProviderAvailable: (provider: ModelProvider) => boolean
}) {
  const [prompt, setPrompt] = useState(version.prompt)
  const [config, setConfig] = useState(version.config)

  const [savedPrompt, setSavedPrompt] = useState(version.prompt)
  if (version.prompt !== savedPrompt) {
    setPrompt(version.prompt)
    setSavedPrompt(version.prompt)
  }

  const [previousVersionID, setPreviousVersionID] = useState(version.id)
  if (version.id !== previousVersionID) {
    setConfig(version.config)
    setPreviousVersionID(version.id)
  }

  const update = (prompt: string, config: PromptConfig) => {
    setPrompt(prompt)
    setConfig(config)
    setModifiedVersion({ ...version, prompt, config })
  }

  const updatePrompt = (prompt: string) => update(prompt, config)
  const updateConfig = (config: PromptConfig) => update(prompt, config)
  const updateProvider = (provider: ModelProvider) => {
    if (checkProviderAvailable(provider)) {
      updateConfig({ ...config, provider })
    }
  }

  // In the play tab, we resolve each variable with any available input and otherwise let it stand for itself.
  const inputs = Object.fromEntries(
    ExtractPromptVariables(prompt).map(variable => [variable, inputValues[variable]?.[0] ?? variable])
  )

  return (
    <div className='flex flex-col gap-4 text-gray-500'>
      <div className='self-stretch'>
        <Suspense>
          <PromptInput prompt={prompt} setPrompt={updatePrompt} showLabel={showLabel} />
        </Suspense>
      </div>
      {runPrompt && <PromptSettingsPane config={config} setConfig={updateConfig} />}
      {runPrompt && (
        <div className='flex items-center self-end gap-4'>
          <ProviderSelector provider={config.provider} setProvider={updateProvider} />
          <PendingButton disabled={!prompt.length} onClick={() => runPrompt(prompt, config, [inputs])}>
            {version.runs.length ? 'Run again' : 'Run'}
          </PendingButton>
        </div>
      )}
    </div>
  )
}
