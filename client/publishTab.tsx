import { ReactNode, useEffect, useState } from 'react'
import { ActivePrompt, ResolvedEndpoint, Run, Version } from '@/types'
import Button from './button'
import api from './api'
import useModalDialogPrompt from './modalDialogContext'
import { useRefreshPrompt, useSavePrompt, useSelectTab } from './refreshContext'
import PickNameDialog from './pickNameDialog'
import Label from './label'
import { ExtractPromptVariables, ToCamelCase } from '@/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'

const buildCurlCommand = (endpoint: ResolvedEndpoint, lastRun: Run) => {
  const apiKey = endpoint.apiKeyDev
  const url = endpoint.url
  const inputs = Object.entries(
    lastRun?.inputs ?? ExtractPromptVariables(endpoint.prompt).map(variable => [variable, ''])
  )

  return (
    `curl -X POST ${url} \\\n  -H "x-api-key: ${apiKey}"` +
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
  const initialFlavor = availableFlavors.find(flavor => endpointFlavors.includes(flavor)) ?? availableFlavors[0]

  const [flavor, setFlavor] = useState(initialFlavor)

  const endpoint: ResolvedEndpoint | undefined = endpoints.find(endpoint => endpoint.flavor === flavor)
  const version = prompt.versions.find(version => version.id === endpoint?.versionID) ?? activeVersion
  const isPublishingDisabled = !endpoint && version.runs.length === 0
  const curlCommand = endpoint ? buildCurlCommand(endpoint, version.runs[0]) : ''

  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()

  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()
  const selectTab = useSelectTab()

  const [canCopyToClipboard, setCanCopyToClipboard] = useState(false)
  useEffect(() => setCanCopyToClipboard(!!navigator.clipboard?.writeText), [])
  const copyToClipboard = (content: string) => navigator.clipboard.writeText(content)

  const publish = async (name: string) => {
    await savePrompt()
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
      setShowPickNamePrompt(true)
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

  return availableFlavors.length > 0 ? (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500 max-w-[50%]'>
        <Label>Settings</Label>
        <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg w-96'>
          <div className='flex items-center gap-8'>
            <Label>Environment</Label>
            <DropdownMenu value={flavor} onChange={setFlavor}>
              {availableFlavors.map((flavor, index) => (
                <option key={index} value={flavor}>
                  {flavor}
                </option>
              ))}
            </DropdownMenu>
          </div>
          <Checkbox
            label='Publish'
            id='publish'
            disabled={isPublishingDisabled}
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
        {isPublishingDisabled && (
          <div className='font-medium underline cursor-pointer text-grey-500' onClick={() => selectTab('test')}>
            Test version before publishing
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
          title='Publish Prompt'
          confirmTitle='Publish'
          label='Endpoint'
          initialName={endpoint?.urlPath}
          validator={(name: string) => api.checkEndpointName(prompt.id, prompt.projectURLPath, name)}
          onConfirm={publish}
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
