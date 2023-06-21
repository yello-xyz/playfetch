import { useState } from 'react'
import LabeledTextInput from './labeledTextInput'
import { PromptConfig, PromptInputs, Version } from '@/types'
import TagsInput from './tagsInput'
import PendingButton from './pendingButton'
import { Label, RangeSlider, TextInput } from 'flowbite-react'
import { ExtractPromptVariables } from '@/common/formatting'
import PromptInput from './promptInput'

const labelForProvider = (provider: PromptConfig['provider']) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI'
    case 'anthropic':
      return 'Anthropic'
    case 'google':
      return 'Google'
  }
}

export default function PromptPanel({
  version,
  setDirtyVersion,
  onRun,
  showTags,
  showInputs,
}: {
  version: Version
  setDirtyVersion: (version?: Version) => void
  onRun: (prompt: string, config: PromptConfig, inputs: PromptInputs) => void
  showTags?: boolean
  showInputs?: boolean
}) {
  const [prompt, setPrompt] = useState<string>(version.prompt)
  const [tags, setTags] = useState(version.tags)

  const versionConfig = version.config

  const [provider, setProvider] = useState<PromptConfig['provider']>(versionConfig.provider)
  const [temperature, setTemperature] = useState(versionConfig.temperature)
  const [maxTokens, setMaxTokens] = useState(versionConfig.maxTokens)

  const [previousVersionID, setPreviousVersionID] = useState(version.id)
  if (version.id !== previousVersionID) {
    setProvider(versionConfig.provider)
    setTemperature(versionConfig.temperature)
    setMaxTokens(versionConfig.maxTokens)
    setPreviousVersionID(version.id)
  }

  const config = { provider, temperature, maxTokens }

  const update = (prompt: string, config: PromptConfig, tags: string) => {
    setPrompt(prompt)
    setProvider(config.provider)
    setTemperature(config.temperature)
    setMaxTokens(config.maxTokens)
    setTags(tags)
    const isDirty =
      prompt !== version.prompt ||
      config.provider !== versionConfig.provider ||
      config.temperature !== versionConfig.temperature ||
      config.maxTokens !== versionConfig.maxTokens ||
      tags !== version.tags
    setDirtyVersion(isDirty ? { ...version, prompt, config, tags } : undefined)
  }

  const updateTags = (tags: string) => update(prompt, config, tags)
  const updatePrompt = (prompt: string) => update(prompt, config, tags)
  const updateConfig = (config: PromptConfig) => update(prompt, config, tags)
  const updateProvider = (provider: PromptConfig['provider']) => updateConfig({ ...config, provider })
  const updateTemperature = (temperature: number) => updateConfig({ ...config, temperature })
  const updateMaxTokens = (maxTokens: number) => updateConfig({ ...config, maxTokens })

  const lastRun = version.runs.slice(-1)[0]
  const [inputState, setInputState] = useState<{ [key: string]: string }>(lastRun?.inputs ?? {})
  const inputVariables = ExtractPromptVariables(prompt)
  const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

  return (
    <>
      <div className='flex flex-col gap-4 px-8 pt-8 text-gray-500 max-w-prose'>
        {inputVariables.length > 0 && (
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
        {showTags && <TagsInput label='Tags (optional)' tags={tags} setTags={updateTags} />}
        <div className='flex gap-2'>
          <PendingButton disabled={!prompt.length} onClick={() => onRun(prompt, config, inputs)}>
            Run
          </PendingButton>
        </div>
        <div className='flex flex-wrap justify-between gap-10'>
          <div>
            <div className='block mb-1'>
              <Label htmlFor='provider' value='Provider' />
            </div>
            <select
              className='w-full p-2 text-gray-500 border border-gray-300 rounded-md'
              value={provider}
              onChange={event => updateProvider(event.target.value as PromptConfig['provider'])}>
              <option value={'openai'}>{labelForProvider('openai')}</option>
              <option value={'anthropic'}>{labelForProvider('anthropic')}</option>
              <option value={'google'}>{labelForProvider('google')}</option>
            </select>
          </div>
          <div>
            <div className='block mb-1'>
              <Label htmlFor='temperature' value={`Temperature: ${temperature}`} />
            </div>
            <RangeSlider
              id='temperature'
              value={temperature}
              min={0}
              max={1}
              step={0.01}
              onChange={event => updateTemperature(Number(event.target.value))}
            />
          </div>
          <div>
            <LabeledTextInput
              id='maxTokens'
              label='Max Tokens'
              value={maxTokens.toString()}
              setValue={value => updateMaxTokens(Number(value))}
            />
          </div>
        </div>
      </div>
    </>
  )
}
