import { useState } from 'react'
import { Endpoint, Project, Prompt, Version } from '@/types'
import PendingButton from './pendingButton'
import { Checkbox, Label } from 'flowbite-react'
import { HiExternalLink } from 'react-icons/hi'
import { EndpointUIRoute } from './clientRoute'
import Link from 'next/link'
import { ExtractPromptVariables } from '@/common/formatting'
import api from './api'
import { useDialogPrompt, usePickNamePrompt } from './modalDialogContext'

export default function PublishPane({
  project,
  prompt,
  version,
  endpoint,
  endpointNameValidator,
  onSavePrompt,
  onRefreshPrompt,
}: {
  project: Project
  prompt: Prompt
  version: Version
  endpoint?: Endpoint
  endpointNameValidator: (name: string) => Promise<{ url?: string }>
  onSavePrompt: () => Promise<void>
  onRefreshPrompt: (focusVersionID?: number) => void
}) {
  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)
  const [curlCommand, setCURLCommand] = useState<string>()

  const setDialogPrompt = useDialogPrompt()
  const setPickNamePrompt = usePickNamePrompt()

  const publish = () => {
    const lastRun = version.runs.slice(-1)[0]
    const inputState = lastRun?.inputs ?? {}
    const inputVariables = ExtractPromptVariables(version.prompt)
    const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

    setPickNamePrompt({
      title: 'Publish Prompt',
      label: 'Endpoint',
      callback: async (name: string) => {
        await onSavePrompt()
        await api
          .publishPrompt(project!.id, prompt.id, name, version.prompt, version.config, inputs, useCache)
          .then(setCURLCommand)
        onRefreshPrompt()
      },
      initialName: endpoint?.urlPath,
      validator: endpointNameValidator,
    })
  }

  const unpublish = () => {
    setDialogPrompt({
      message: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
      callback: async () => {
        setCURLCommand(undefined)
        await api.unpublishPrompt(prompt.id)
        onRefreshPrompt()
      },
      destructive: true,
    })
  }

  return (
    <>
      <div className='flex flex-col gap-4 px-8 pt-8 text-gray-500 max-w-prose'>
        <div className='flex flex-wrap justify-between gap-10'>
          <div className='flex items-baseline gap-2'>
            <Checkbox id='useCache' checked={useCache} onChange={() => setUseCache(!useCache)} />
            <div className='block mb-1'>
              <Label htmlFor='useCache' value='Use cache' />
            </div>
          </div>
        </div>
        <div className='flex gap-2'>
          <PendingButton disabled={version.runs.length === 0} onClick={publish}>
            {endpoint ? 'Republish' : 'Publish'}
          </PendingButton>
          {endpoint && <PendingButton onClick={unpublish}>Unpublish</PendingButton>}
        </div>
        {endpoint && (
          <div className='flex gap-2'>
            <div className='font-bold text-black'>
              Prompt published as <pre className='inline'>{`/${endpoint.projectURLPath}/${endpoint.urlPath}`}</pre>
            </div>{' '}
            <Link href={EndpointUIRoute(endpoint)} target='_blank'>
              <HiExternalLink size={20} />
            </Link>
          </div>
        )}
        {curlCommand && (
          <div className='flex flex-col gap-4 text-black whitespace-pre-wrap'>
            Try out your API endpoint by running:
            <pre>{curlCommand}</pre>
          </div>
        )}
      </div>
    </>
  )
}
