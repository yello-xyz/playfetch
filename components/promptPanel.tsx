import { useState } from 'react'
import { PromptConfig, PromptInputs, Version } from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import PromptInput from './promptInput'
import PromptSettingsPane from './promptSettingsPane'
import { PendingButton } from './button'
import DropdownMenu from './dropdownMenu'

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
  onRun,
  showLabel,
  showInputControls,
}: {
  version: Version
  setModifiedVersion: (version: Version) => void
  onRun?: (prompt: string, config: PromptConfig, inputs: PromptInputs[]) => void
  showLabel?: boolean
  showInputControls?: boolean
}) {
  const [prompt, setPrompt] = useState<string>(version.prompt)
  const [config, setConfig] = useState(version.config)

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
  const updateProvider = (provider: PromptConfig['provider']) => updateConfig({ ...config, provider })

  // In the play tab, we let variables just stand for themselves rather than resolving them with test values.
  // Once you start adding input variables in the Test tab, you are less likely to keep running in Play tab.
  const dummyInputs = Object.fromEntries(ExtractPromptVariables(prompt).map(variable => [variable, variable]))

  return (
    <div className='flex flex-col gap-4 text-gray-500'>
      <div className='self-stretch'>
        <PromptInput
          prompt={prompt}
          setPrompt={updatePrompt}
          showLabel={showLabel}
          showInputControls={showInputControls}
        />
      </div>
      {onRun && <PromptSettingsPane config={config} setConfig={updateConfig} />}
      {onRun && (
        <div className='flex items-center self-end gap-4'>
          <DropdownMenu
            size='medium'
            value={config.provider}
            onChange={value => updateProvider(value as PromptConfig['provider'])}>
            <option value={'openai'}>{labelForProvider('openai')}</option>
            <option value={'anthropic'}>{labelForProvider('anthropic')}</option>
            <option value={'google'}>{labelForProvider('google')}</option>
          </DropdownMenu>
          <PendingButton disabled={!prompt.length} onClick={() => onRun(prompt, config, [dummyInputs])}>
            {version.runs.length ? 'Run again' : 'Run'}
          </PendingButton>
        </div>
      )}
    </div>
  )
}
