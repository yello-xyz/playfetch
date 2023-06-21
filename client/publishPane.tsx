import { useState } from 'react'
import { Endpoint, PromptConfig, PromptInputs, Version } from '@/types'
import PendingButton from './pendingButton'
import { Checkbox, Label } from 'flowbite-react'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
import ModalDialog, { DialogPrompt } from './modalDialog'
import { HiExternalLink } from 'react-icons/hi'
import { EndpointUIRoute } from './clientRoute'
import Link from 'next/link'
import { ExtractPromptVariables } from '@/common/formatting'

export default function PublishPane({
  version,
  endpoint,
  endpointNameValidator,
  onPublish,
  onUnpublish,
}: {
  version: Version
  endpoint?: Endpoint
  endpointNameValidator: (name: string) => Promise<{ url?: string }>
  onPublish: (name: string, prompt: string, config: PromptConfig, inputs: PromptInputs, useCache: boolean) => void
  onUnpublish: () => void
}) {
  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)

  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()

  const publish = () => {
    const prompt = version.prompt
    const lastRun = version.runs.slice(-1)[0]
    const inputState = lastRun?.inputs ?? {}
    const inputVariables = ExtractPromptVariables(prompt)
    const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

    setPickNamePrompt({
      title: 'Publish Prompt',
      label: 'Endpoint',
      callback: (name: string) => {
        onPublish?.(name, prompt, version.config, inputs, useCache)
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

  return (
    <>
      <div className='flex flex-col gap-4 px-8 pt-8 text-gray-500 max-w-prose'>
        <div className='flex gap-2'>
          <PendingButton disabled={version.runs.length === 0} onClick={publish}>
              {endpoint ? 'Republish' : 'Publish'}
            </PendingButton>
          {endpoint && <PendingButton onClick={unpublish}>Unpublish</PendingButton>}
        </div>
        <div className='flex flex-wrap justify-between gap-10'>
          <div className='flex items-baseline gap-2'>
            <Checkbox id='useCache' checked={useCache} onChange={() => setUseCache(!useCache)} />
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
              <HiExternalLink size={20} />
            </Link>
          </div>
        )}
      </div>
      <PickNameDialog key={endpoint?.urlPath ?? version.id} prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
    </>
  )
}
