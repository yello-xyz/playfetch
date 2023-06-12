import { MouseEvent, useState } from 'react'
import LabeledTextInput from './labeledTextInput'
import { Endpoint, Project, Run, RunConfig, Version } from '@/types'
import TagsInput from './tagsInput'
import PendingButton from './pendingButton'
import { Dropdown, Label, RangeSlider, TextInput, Tooltip } from 'flowbite-react'
import sanitizeHtml from 'sanitize-html'
import ContentEditable from 'react-contenteditable'
import { ContentEditableEvent } from 'react-contenteditable'
import { FocusEvent } from 'react'
import { useRef } from 'react'
import PickNameDialog, { DialogPrompt } from './pickNameDialog'
import { HiCodeBracketSquare } from 'react-icons/hi2'

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

const DefaultConfig: RunConfig = {
  provider: 'openai',
  temperature: 0.5,
  maxTokens: 250,
  inputs: {},
}

export default function PromptPanel({
  project,
  version,
  activeRun,
  endpoint,
  setDirtyVersion,
  onRun,
  onSave,
  onPublish,
}: {
  project: Project
  version: Version
  activeRun?: Run
  endpoint?: Endpoint
  setDirtyVersion: (version?: Version) => void
  onRun: (prompt: string, config: RunConfig) => void
  onPublish: (projectID: number, endpoint: string, prompt: string, config: RunConfig) => void
  onSave: () => void
}) {
  const [prompt, setPrompt] = useState<string>(version.prompt)
  const [title, setTitle] = useState(version.title)
  const [tags, setTags] = useState(version.tags)
  const [isDirty, setDirty] = useState(false)

  const runConfig = activeRun?.config ?? DefaultConfig

  const [provider, setProvider] = useState<RunConfig['provider']>(runConfig.provider)
  const [temperature, setTemperature] = useState(runConfig.temperature)
  const [maxTokens, setMaxTokens] = useState(runConfig.maxTokens)

  const [previousActiveRunID, setPreviousRunID] = useState(activeRun?.id)
  if (activeRun?.id !== previousActiveRunID) {
    setProvider(runConfig.provider)
    setTemperature(runConfig.temperature)
    setMaxTokens(runConfig.maxTokens)
    setPreviousRunID(activeRun?.id)
  }

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const publish = () => {
    setDialogPrompt({
      title: 'Publish Prompt',
      label: 'Endpoint',
      callback: (endpoint: string) => {
        onPublish(project.id, endpoint, prompt, { provider, temperature, maxTokens, inputs })
      },
      validator: (endpoint: string) => Promise.resolve({ url: endpoint?.length ? endpoint : undefined }),
    })
  }

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
    .replaceAll(/{{([^{]*?)}}/g, '<b>$1</b>')
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
        .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
        .replaceAll(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
        .replaceAll(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')
    )
  }

  const extractVariable = (event: MouseEvent) => {
    event.preventDefault()
    document.execCommand('bold', false)
  }

  const [inputState, setInputState] = useState<{ [key: string]: string }>(runConfig.inputs ?? {})
  const inputVariables = [...new Set(prompt.match(/{{(.*?)}}/g)?.map(match => match.replace(/{{(.*?)}}/g, '$1')) ?? [])]
  const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

  return (
    <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto text-gray-500 max-w-prose'>
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
                required={true}
              />
            </div>
          ))}
        </div>
      )}
      <div className='self-stretch'>
        <div className='flex items-center block gap-2 mb-1'>
          <Label value='Prompt' onClick={() => contentEditableRef.current?.focus()} />
          <Tooltip content='Extract variable'>
            <HiCodeBracketSquare size={24} className='cursor-pointer' onMouseDown={extractVariable} />
          </Tooltip>
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
        <PendingButton
          disabled={!prompt.length}
          onClick={() => onRun(prompt, { provider, temperature, maxTokens, inputs })}>
          Run
        </PendingButton>
        <PendingButton disabled={!isDirty} onClick={onSave}>
          Save
        </PendingButton>
        <PendingButton disabled={version.runs.length === 0} onClick={publish}>
          {endpoint ? 'Republish' : 'Publish'}
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
      {endpoint && (
        <div className='font-bold text-black'>
          Prompt published as <pre className='inline'>{`/${project.urlPath}/${endpoint.name}`}</pre>
        </div>
      )}
      <PickNameDialog
        key={endpoint?.name ?? version.id}
        initialName={endpoint?.name}
        prompt={dialogPrompt}
        setPrompt={setDialogPrompt}
      />
    </div>
  )
}
