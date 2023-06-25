import { useState } from 'react'
import { PromptConfig, PromptInputs, Version } from '@/types'
import { Label, TextInput } from 'flowbite-react'
import { ExtractPromptVariables } from '@/common/formatting'
import PromptInput from './promptInput'
import PromptSettingsPane from './promptSettingsPane'

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
  showInputs,
}: {
  version: Version
  setModifiedVersion: (version?: Version) => void
  onRun?: (prompt: string, config: PromptConfig, inputs: PromptInputs) => void
  showInputs?: boolean
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

  const lastRun = version.runs.slice(-1)[0]
  const [inputState, setInputState] = useState<{ [key: string]: string }>(lastRun?.inputs ?? {})
  const inputVariables = ExtractPromptVariables(prompt)
  const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

  return (
    <div className='flex flex-col gap-4 text-gray-500'>
      {showInputs && inputVariables.length > 0 && (
        <div className='flex flex-col gap-2'>
          <Label value='Inputs' />
          {inputVariables.map((variable, index) => (
            <div key={index} className='flex gap-2'>
              <Label className='flex-1' value={variable} htmlFor={variable} />
              <TextInput
                className='flex-1'
                sizing='sm'
                value={inputState[variable] ?? ''}
                onChange={event => setInputState({ ...inputState, [variable]: event.target.value })}
                id={variable}
                required
              />
            </div>
          ))}
        </div>
      )}
      <div className='self-stretch'>
        <PromptInput prompt={prompt} setPrompt={updatePrompt} showInputs={showInputs} />
      </div>
      {onRun && <PromptSettingsPane config={config} setConfig={updateConfig} />}
      {onRun && (
        <div className='flex items-center self-end gap-4'>
          <select
            className='text-sm text-black border border-gray-300 rounded-lg'
            value={config.provider}
            onChange={event => updateProvider(event.target.value as PromptConfig['provider'])}>
            <option value={'openai'}>{labelForProvider('openai')}</option>
            <option value={'anthropic'}>{labelForProvider('anthropic')}</option>
            <option value={'google'}>{labelForProvider('google')}</option>
          </select>
          <button
            className='px-4 py-2 text-white bg-blue-600 rounded-lg disabled:opacity-50'
            disabled={!prompt.length}
            onClick={() => onRun(prompt, config, inputs)}>
            {version.runs.length ? 'Run again' : 'Run'}
          </button>
        </div>
      )}
    </div>
  )
}
