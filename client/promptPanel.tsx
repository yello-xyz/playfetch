import { useState } from 'react'
import LabeledTextInput from './labeledTextInput'
import { RunConfig, Version } from '@/types'
import TagsInput from './tagsInput'
import PendingButton from './pendingButton'
import { Dropdown, Label, RangeSlider } from 'flowbite-react'

const labelForProvider = (provider: RunConfig['provider']) => {
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
  onSave,
}: {
  version: Version
  setDirtyVersion: (version?: Version) => void
  onRun: (config: RunConfig) => void
  onSave: () => void
}) {
  const [prompt, setPrompt] = useState<string>(version.prompt)
  const [title, setTitle] = useState(version.title)
  const [tags, setTags] = useState(version.tags)
  const [isDirty, setDirty] = useState(false)

  const [provider, setProvider] = useState<RunConfig['provider']>('openai')
  const [temperature, setTemperature] = useState(0.5)
  const [maxTokens, setMaxTokens] = useState(250)

  const update = (prompt: string, title: string, tags: string) => {
    setPrompt(prompt)
    setTitle(title)
    setTags(tags)
    const isDirty = prompt !== version.prompt || title !== version.title || tags !== version.tags
    setDirty(isDirty)
    setDirtyVersion(isDirty ? { ...version, prompt, title, tags } : undefined)
  }

  const updateTitle = (title: string) => update(prompt, title, tags)
  const updateTags = (tags: string) => update(prompt, title, tags)
  const updatePrompt = (prompt: string) => update(prompt, title, tags)

  return (
    <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto text-gray-500 max-w-prose'>
      <div className='self-stretch'>
        <LabeledTextInput
          id='prompt'
          multiline
          label='Prompt'
          placeholder='Enter your prompt...'
          value={prompt}
          setValue={updatePrompt}
        />
      </div>
      <LabeledTextInput id='title' label='Title (optional)' value={title} setValue={updateTitle} />
      <TagsInput label='Tags (optional)' tags={tags} setTags={updateTags} />
      <div className='flex gap-2'>
        <PendingButton disabled={!prompt.length} onClick={() => onRun({ provider, temperature, maxTokens })}>
          Run
        </PendingButton>
        <PendingButton disabled={!isDirty} onClick={onSave}>
          Save
        </PendingButton>
      </div>
      <div>
        <div className='block mb-1'>
          <Label htmlFor='provider' value='Provider' />
        </div>
        <Dropdown label={labelForProvider(provider)}>
          <Dropdown.Item onClick={() => setProvider('openai')}>
            {labelForProvider('openai')}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setProvider('anthropic')}>
            {labelForProvider('anthropic')}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setProvider('google')}>
            {labelForProvider('google')}
          </Dropdown.Item>
        </Dropdown>
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
          onChange={event => setTemperature(Number(event.target.value))}
        />
      </div>
      <div>
        <LabeledTextInput
          id='maxTokens'
          label='Max Tokens'
          value={maxTokens.toString()}
          setValue={value => setMaxTokens(Number(value))}
        />
      </div>
    </div>
  )
}
