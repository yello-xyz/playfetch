import { MouseEvent, useState } from 'react'
import LabeledTextInput from './labeledTextInput'
import { Endpoint, PromptConfig, PromptInputs, Run, Version } from '@/types'
import TagsInput from './tagsInput'
import PendingButton from './pendingButton'
import { Checkbox, Dropdown, Label, RangeSlider, TextInput, Tooltip } from 'flowbite-react'
import sanitizeHtml from 'sanitize-html'
import ContentEditable from 'react-contenteditable'
import { ContentEditableEvent } from 'react-contenteditable'
import { FocusEvent } from 'react'
import { useRef } from 'react'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
import { HiCodeBracketSquare } from 'react-icons/hi2'
import ModalDialog, { DialogPrompt } from './modalDialog'
import { HiExternalLink } from 'react-icons/hi'
import { EndpointUIRoute } from './clientRoute'
import Link from 'next/link'
import { ExtractPromptVariables } from '@/common/formatting'

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
  activeRun,
  endpoint,
  setDirtyVersion,
  endpointNameValidator,
  onRun,
  onPublish,
  onUnpublish,
}: {
  version: Version
  activeRun?: Run
  endpoint?: Endpoint
  setDirtyVersion: (version?: Version) => void
  endpointNameValidator: (name: string) => Promise<{ url?: string }>
  onRun: (prompt: string, config: PromptConfig, inputs: PromptInputs) => void
  onPublish?: (name: string, prompt: string, config: PromptConfig, inputs: PromptInputs) => void
  onUnpublish: () => void
}) {
  const [prompt, setPrompt] = useState<string>(version.prompt)
  const [tags, setTags] = useState(version.tags)

  const versionConfig = version.config

  const [provider, setProvider] = useState<PromptConfig['provider']>(versionConfig.provider)
  const [temperature, setTemperature] = useState(versionConfig.temperature)
  const [maxTokens, setMaxTokens] = useState(versionConfig.maxTokens)
  const [useCache, setUseCache] = useState(versionConfig.useCache)

  const [previousVersionID, setPreviousVersionID] = useState(version.id)
  if (version.id !== previousVersionID) {
    setProvider(versionConfig.provider)
    setTemperature(versionConfig.temperature)
    setMaxTokens(versionConfig.maxTokens)
    setUseCache(versionConfig.useCache)
    setPreviousVersionID(version.id)
  }

  const config = { provider, temperature, maxTokens, useCache }

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()

  const publish = () => {
    setPickNamePrompt({
      title: 'Publish Prompt',
      label: 'Endpoint',
      callback: (name: string) => {
        onPublish?.(name, prompt, config, inputs)
      },
      initialName: endpoint?.urlPath,
      validator: endpointNameValidator,
    })
  }

  const unpublish = () => {
    setDialogPrompt({
      message: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
      callback: () => onUnpublish(),
      destructive: true,
    })
  }

  const update = (prompt: string, config: PromptConfig, tags: string) => {
    setPrompt(prompt)
    setProvider(config.provider)
    setTemperature(config.temperature)
    setMaxTokens(config.maxTokens)
    setUseCache(config.useCache)
    setTags(tags)
    const isDirty =
      prompt !== version.prompt ||
      config.provider !== versionConfig.provider ||
      config.temperature !== versionConfig.temperature ||
      config.maxTokens !== versionConfig.maxTokens ||
      config.useCache !== versionConfig.useCache ||
      tags !== version.tags
    setDirtyVersion(isDirty ? { ...version, prompt, config, tags } : undefined)
  }

  const updateTags = (tags: string) => update(prompt, config, tags)
  const updatePrompt = (prompt: string) => update(prompt, config, tags)
  const updateConfig = (config: PromptConfig) => update(prompt, config, tags)
  const updateProvider = (provider: PromptConfig['provider']) => updateConfig({ ...config, provider })
  const updateTemperature = (temperature: number) => updateConfig({ ...config, temperature })
  const updateMaxTokens = (maxTokens: number) => updateConfig({ ...config, maxTokens })
  const updateUseCache = (useCache: boolean) => updateConfig({ ...config, useCache })

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

  const [inputState, setInputState] = useState<{ [key: string]: string }>(activeRun?.inputs ?? {})
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
            className='p-2 bg-gray-100'
            onChange={updateHTMLContent}
            html={htmlContent}
            innerRef={contentEditableRef}
          />
        </div>
        <TagsInput label='Tags (optional)' tags={tags} setTags={updateTags} />
        <div className='flex gap-2'>
          <PendingButton disabled={!prompt.length} onClick={() => onRun(prompt, config, inputs)}>
            Run
          </PendingButton>
          {onPublish && (
            <PendingButton disabled={version.runs.length === 0} onClick={publish}>
              {endpoint ? 'Republish' : 'Publish'}
            </PendingButton>
          )}
          {endpoint && <PendingButton onClick={unpublish}>Unpublish</PendingButton>}
        </div>
        <div className='flex flex-wrap justify-between gap-10'>
          <div>
            <div className='block mb-1'>
              <Label htmlFor='provider' value='Provider' />
            </div>
            <Dropdown label={labelForProvider(provider)}>
              <Dropdown.Item onClick={() => updateProvider('openai')}>{labelForProvider('openai')}</Dropdown.Item>
              <Dropdown.Item onClick={() => updateProvider('anthropic')}>{labelForProvider('anthropic')}</Dropdown.Item>
              <Dropdown.Item onClick={() => updateProvider('google')}>{labelForProvider('google')}</Dropdown.Item>
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
          <div className='flex items-baseline gap-2'>
            <Checkbox id='useCache' checked={useCache} onChange={() => updateUseCache(!useCache)} />
            <div className='block mb-1'>
              <Label htmlFor='useCache' value='Use cache' />
            </div>
          </div>
        </div>
        {endpoint && (
          <div className='flex gap-2'>
            <div className='font-bold text-black'>
              Prompt published as <pre className='inline'>{`/${endpoint.projectURLPath}/${endpoint.urlPath}`}</pre>
            </div>{' '}
            <Link href={EndpointUIRoute(endpoint)} target='_blank'>
              <Tooltip content='Try in UI'>
                <HiExternalLink size={20} />
              </Tooltip>
            </Link>
          </div>
        )}
      </div>
      <PickNameDialog key={endpoint?.urlPath ?? version.id} prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
    </>
  )
}
