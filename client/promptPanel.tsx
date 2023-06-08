import { useState } from 'react'
import LabeledTextInput from './labeledTextInput'
import { RunConfig, Version } from '@/types'
import TagsInput from './tagsInput'
import PendingButton from './pendingButton'
import { Dropdown, Label, RangeSlider } from 'flowbite-react'
import sanitizeHtml from 'sanitize-html'
import ContentEditable from 'react-contenteditable'
import { ContentEditableEvent } from 'react-contenteditable'
import { FocusEvent } from 'react'
import { useRef } from 'react'

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
  onRun: (prompt: string, config: RunConfig) => void
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

  const contentEditableRef = useRef<HTMLElement>(null)
  const htmlContent = prompt
    .replaceAll(/{{(.*?)}}/g, '<b>$1</b>')
    .replaceAll(/\n(.*)$/gm, '<div>$1</div>')
    .replaceAll('<div></div>', '<div><br /></div>')

  const updateHTMLContent = (event: ContentEditableEvent | FocusEvent) => {
    updatePrompt(
      sanitizeHtml(event.currentTarget.innerHTML, {
        allowedTags: ['br', 'div', 'b'],
        allowedAttributes: {},
      })
        .replaceAll('<br />', '')
        .replaceAll(/<div>(.*?)<\/div>/g, '\n$1')
        .replaceAll(/<b>(.*?)<\/b>/g, '{{$1}}')
        .replaceAll('{{}}', '')
    )
  }

  return (
    <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto text-gray-500 max-w-prose'>
      <div className='self-stretch'>
        <div className='block mb-1'>
          <Label value='Prompt' onClick={() => contentEditableRef.current?.focus()} />
        </div>
        <ContentEditable
          className='p-2 bg-white'
          onChange={updateHTMLContent}
          onBlur={updateHTMLContent}
          html={htmlContent}
          innerRef={contentEditableRef}
        />
      </div>
      <LabeledTextInput id='title' label='Title (optional)' value={title} setValue={updateTitle} />
      <TagsInput label='Tags (optional)' tags={tags} setTags={updateTags} />
      <div className='flex gap-2'>
        <PendingButton disabled={!prompt.length} onClick={() => onRun(prompt, { provider, temperature, maxTokens })}>
          Run
        </PendingButton>
        <PendingButton disabled={!isDirty} onClick={onSave}>
          Save
        </PendingButton>
      </div>
      <div className='flex justify-between gap-10'>
        <div>
          <div className='block mb-1'>
            <Label htmlFor='provider' value='Provider' />
          </div>
          <Dropdown label={labelForProvider(provider)}>
            <Dropdown.Item onClick={() => setProvider('openai')}>{labelForProvider('openai')}</Dropdown.Item>
            <Dropdown.Item onClick={() => setProvider('anthropic')}>{labelForProvider('anthropic')}</Dropdown.Item>
            <Dropdown.Item onClick={() => setProvider('google')}>{labelForProvider('google')}</Dropdown.Item>
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
    </div>
  )
}
