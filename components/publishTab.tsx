import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ActivePrompt, ResolvedEndpoint, Run, Version } from '@/types'
import Button from './button'
import api from '../src/client/api'
import useModalDialogPrompt from './modalDialogContext'
import { useRefreshPrompt, useSelectTab } from './refreshContext'
import Label from './label'
import { CheckValidURLPath, ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import TextInput from './textInput'
import { debounce } from 'debounce'
import PickNameDialog from './pickNameDialog'

const buildCurlCommand = (endpoint: ResolvedEndpoint, lastRun: Run, defaultFlavor: string) => {
  const apiKey = endpoint.apiKeyDev
  const url = endpoint.url
  const inputs = Object.entries(
    lastRun?.inputs ?? ExtractPromptVariables(endpoint.prompt).map(variable => [variable, ''])
  )

  return (
    `curl -X POST ${url} \\\n  -H "x-api-key: ${apiKey}"` +
    (endpoint.flavor !== defaultFlavor ? ` \\\n  -H "x-environment: ${endpoint.flavor}"` : '') +
    (inputs.length > 0
      ? ` \\\n  -H "content-type: application/json"` +
        ` \\\n  -d '{ ${inputs.map(([variable, value]) => `"${ToCamelCase(variable)}": "${value}"`).join(', ')} }'`
      : '')
  )
}

export default function PublishTab({
  prompt,
  activeVersion,
  setActiveVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const availableFlavors = prompt.availableFlavors
  const endpoints = prompt.endpoints
  const endpointFlavors = endpoints.map(endpoint => endpoint.flavor)
  const flavorOfActiveVersion = endpoints.find(endpoint => endpoint.versionID === activeVersion.id)?.flavor
  const initialFlavor =
    flavorOfActiveVersion ?? availableFlavors.find(flavor => endpointFlavors.includes(flavor)) ?? availableFlavors[0]

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [flavor, setFlavor] = useState(initialFlavor)

  const endpoint: ResolvedEndpoint | undefined = endpoints.find(endpoint => endpoint.flavor === flavor)
  const version = prompt.versions.find(version => version.id === endpoint?.versionID) ?? activeVersion
  const curlCommand = endpoint ? buildCurlCommand(endpoint, version.runs[0], availableFlavors[0]) : ''

  const checkName = useMemo(
    () =>
      debounce((name: string) => api.checkEndpointName(prompt.id, prompt.projectURLPath, name).then(setNameAvailable)),
    [prompt]
  )

  const updateName = useCallback((name: string) => {
    setName(name)
    setNameAvailable(undefined)
    if (CheckValidURLPath(name)) {
      checkName(name)
    } else {
      setNameAvailable(false)
    }
  }, [checkName])

  const initialName =
    endpoint?.urlPath ?? endpoints[0]?.urlPath ?? ToCamelCase(prompt.name.split(' ').slice(0, 3).join(' '))
  const [name, setName] = useState(initialName)
  const [nameAvailable, setNameAvailable] = useState<boolean>()
  useEffect(() => updateName(initialName), [initialName, updateName])

  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)

  const noRuns = version.runs.length === 0
  const publishingDisabled = !endpoint && (noRuns || !nameAvailable)
  const setDialogPrompt = useModalDialogPrompt()

  const refreshPrompt = useRefreshPrompt()
  const selectTab = useSelectTab()

  const [canCopyToClipboard, setCanCopyToClipboard] = useState(false)
  useEffect(() => setCanCopyToClipboard(!!navigator.clipboard?.writeText), [])
  const copyToClipboard = (content: string) => navigator.clipboard.writeText(content)

  const publish = async (name: string) => {
    await api.publishPrompt(
      prompt.projectID,
      prompt.id,
      version.id,
      name,
      flavor,
      version.prompt,
      version.config,
      useCache
    )
    refreshPrompt()
  }

  const unpublish = (endpointID: number) => {
    setDialogPrompt({
      title: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
      callback: async () => {
        await api.unpublishPrompt(endpointID)
        refreshPrompt()
      },
      destructive: true,
    })
  }

  const togglePublish = () => {
    if (endpoint) {
      unpublish(endpoint.id)
    } else {
      publish(name)
    }
  }

  const toggleCache = (checked: boolean) => {
    setUseCache(checked)
    if (endpoint) {
      api.toggleCache(endpoint.id, checked).then(_ => refreshPrompt())
    }
  }

  const switchToPublishedVersion = () => {
    setActiveVersion(version)
    selectTab('play')
  }

  const addNewEnvironment = 'Add New Environment…'
  const updateFlavor = (flavor: string) => {
    if (flavor === addNewEnvironment) {
      setShowPickNamePrompt(true)
    } else {
      setFlavor(flavor)
    }
  }

  const addFlavor = async (flavor: string) => {
    await api.addFlavor(prompt.projectID, flavor)
    await refreshPrompt()
    setFlavor(flavor)
  }

  return availableFlavors.length > 0 ? (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500 max-w-[50%]'>
        <Label>Settings</Label>
        <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg w-96'>
          <div className='flex items-center gap-8'>
            <Label>Environment</Label>
            <DropdownMenu value={flavor} onChange={updateFlavor}>
              {availableFlavors.map((flavor, index) => (
                <option key={index} value={flavor}>
                  {flavor}
                </option>
              ))}
              <option value={addNewEnvironment} onClick={() => setShowPickNamePrompt(true)}>
                {addNewEnvironment}
              </option>
            </DropdownMenu>
          </div>
          <div className='flex items-center gap-8'>
            <Label className='w-32'>Name</Label>
            {endpoint || noRuns ? (
              <div className='flex-1 text-right'>{name}</div>
            ) : (
              <TextInput value={name} setValue={name => updateName(ToCamelCase(name))} />
            )}
          </div>
          <Checkbox
            label='Publish'
            id='publish'
            disabled={publishingDisabled}
            checked={!!endpoint}
            setChecked={togglePublish}
          />
          <Checkbox label='Cache' id='cache' checked={useCache} setChecked={toggleCache} />
        </div>
        {version.id !== activeVersion.id && (
          <div className='font-medium underline cursor-pointer text-grey-500' onClick={switchToPublishedVersion}>
            Switch to published version
          </div>
        )}
        {noRuns && (
          <div className='font-medium underline cursor-pointer text-grey-500' onClick={() => selectTab('test')}>
            Test version before publishing
          </div>
        )}
        {nameAvailable === false && name.length > 0 && (
          <div className='font-medium text-grey-500'>
            {CheckValidURLPath(name) ? 'Name already used for other prompt in project' : 'Invalid endpoint name'}
          </div>
        )}
      </div>
      <div className='flex flex-col p-6 pl-0 items-'>
        {endpoint && (
          <div className='flex flex-col items-start gap-4'>
            <Label>Endpoint</Label>
            <CodeBlock>
              <MarkedUpCURLCommand>{curlCommand}</MarkedUpCURLCommand>
            </CodeBlock>
            {canCopyToClipboard && (
              <div className='self-end'>
                <Button onClick={() => copyToClipboard(curlCommand)}>Copy</Button>
              </div>
            )}
          </div>
        )}
      </div>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Add Project Environment'
          confirmTitle='Add'
          label='Name'
          initialName={availableFlavors.includes('production') ? '' : 'production'}
          onConfirm={addFlavor}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  ) : (
    <EmptyPublishTab />
  )
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <div className='p-4 text-xs text-green-600 bg-gray-100 rounded-lg'>
      <div className='relative overflow-hidden'>
        {children}
        <div className='absolute top-0 left-0'>
          <pre className='w-4 text-right text-gray-400'>
            {[...Array(100).keys()].map(i => (i + 1).toString()).join('\n')}
          </pre>
        </div>
      </div>
    </div>
  )
}

function MarkedUpCURLCommand({ children }: { children: ReactNode }) {
  return (
    <pre className='pl-10 break-all whitespace-pre-wrap'>
      {children
        ?.toString()
        .split('\n')
        .map((line, index) => (
          <div key={index}>
            <MarkedUpStartLine
              line={line}
              markup={[
                ['curl', 'text-fuchsia-500'],
                ['-X POST', 'text-blue-500'],
              ]}>
              <MarkedUpStartLine line={line} markup={[['  -H', 'text-blue-500']]}>
                <MarkedUpStartLine line={line} markup={[['  -d', 'text-blue-500']]}>
                  {line}
                </MarkedUpStartLine>
              </MarkedUpStartLine>
            </MarkedUpStartLine>
          </div>
        ))}
    </pre>
  )
}

function MarkedUpStartLine({ line, markup, children }: { line: string; markup: string[][]; children: ReactNode }) {
  const sentinel = markup.map(([text]) => text).join(' ')
  return line.startsWith(sentinel) ? (
    <>
      {markup.map(([text, color], index) => (
        <span key={index} className={color}>
          {index > 0 ? ' ' : ''}
          {text}
        </span>
      ))}
      {line.replace(sentinel, '')}
    </>
  ) : (
    <>{children}</>
  )
}

function EmptyPublishTab() {
  return (
    <div className='flex flex-col items-center justify-center w-full p-8 m-8 bg-gray-100 rounded-lg'>
      <span className='font-medium text-gray-600'>Move your prompt to a Project before publishing it</span>
    </div>
  )
}
