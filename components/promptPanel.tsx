import { Suspense, useState } from 'react'
import { InputValues, PromptConfig, PromptInputs, Version } from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import PromptSettingsPane from './promptSettingsPane'
import { PendingButton } from './button'
import DropdownMenu from './dropdownMenu'

import dynamic from 'next/dynamic'
const PromptInput = dynamic(() => import('./promptInput'))

const labelForProvider = (provider: PromptConfig['provider']) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI - GPT-3.5'
    case 'anthropic':
      return 'Anthropic - Claude v1'
    case 'google':
      return 'Google - PaLM v2'
  }
}

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
  checkProviderAvailable: (provider: PromptConfig['provider']) => boolean
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
  const updateProvider = (provider: PromptConfig['provider']) => {
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
          <DropdownMenu
            size='medium'
            value={config.provider}
            onChange={value => updateProvider(value as PromptConfig['provider'])}>
            <option value={'anthropic'}>{labelForProvider('anthropic')}</option>
            <option value={'google'}>{labelForProvider('google')}</option>
            <option value={'openai'}>{labelForProvider('openai')}</option>
          </DropdownMenu>
          <PendingButton disabled={!prompt.length} onClick={() => runPrompt(prompt, config, [inputs])}>
            {version.runs.length ? 'Run again' : 'Run'}
          </PendingButton>
        </div>
      )}
    </div>
  )
}
