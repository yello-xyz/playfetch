import { ReactNode, useEffect, useState } from 'react'
import { ActivePrompt, ResolvedEndpoint, Run, Version } from '@/types'
import Button, { PendingButton } from './button'
import api from './api'
import useModalDialogPrompt from './modalDialogContext'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import PickNameDialog from './pickNameDialog'
import Label from './label'
import { ToCamelCase } from '@/common/formatting'

const buildCurlCommand = (endpoint: ResolvedEndpoint, lastRun: Run) => {
  const apiKey = endpoint.apiKeyDev
  const url = endpoint.url
  const inputs = Object.entries(lastRun.inputs)

  return inputs.length
    ? `curl -X POST ${url} \\
  -H "x-api-key: ${apiKey}" \\
  -H "content-type: application/json" \\
  -d '{ ${inputs.map(([variable, value]) => `"${ToCamelCase(variable)}": "${value}"`).join(', ')} }'`
    : `curl -X POST ${url} -H "x-api-key: ${apiKey}"`
}

export default function PublishTab({ prompt, version }: { prompt: ActivePrompt; version: Version }) {
  // TODO render all endpoints
  const endpoint: ResolvedEndpoint | undefined = prompt.endpoints[0]
  // TODO allow publishing to other environments
  const flavor = prompt.availableFlavors[0]
  const curlCommand = buildCurlCommand(endpoint, version.runs[0])

  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()

  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()

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

  return prompt.availableFlavors.length > 0 ? (
    <>
      <div className='flex flex-col flex-1 gap-4 p-6 text-gray-500'>
        <div className='flex flex-wrap justify-between gap-10'>
          <div className='flex items-baseline gap-2'>
            <input type='checkbox' id='useCache' checked={useCache} onChange={() => setUseCache(!useCache)} />
            <Label htmlFor='useCache'>Use cache</Label>
          </div>
        </div>
        <div className='flex gap-2'>
          <PendingButton disabled={version.runs.length === 0} onClick={() => setShowPickNamePrompt(true)}>
            {endpoint ? 'Republish' : 'Publish'}
          </PendingButton>
          {endpoint && <PendingButton onClick={() => unpublish(endpoint.id)}>Unpublish</PendingButton>}
        </div>
        {endpoint && (
          <div className='flex gap-2'>
            <div className='font-bold text-black'>
              Prompt published as <pre className='inline'>{`/${endpoint.projectURLPath}/${endpoint.urlPath}`}</pre>
            </div>{' '}
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
          {index > 0 ? ' ' : ''}{text}
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
