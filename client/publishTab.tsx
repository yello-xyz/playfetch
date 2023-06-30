import { useState } from 'react'
import { ActivePrompt, EndpointWithExample, Version } from '@/types'
import { PendingButton } from './button'
import api from './api'
import useModalDialogPrompt from './modalDialogContext'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import PickNameDialog from './pickNameDialog'
import Label from './label'

export default function PublishTab({ prompt, version }: { prompt: ActivePrompt; version: Version }) {
  // TODO render all endpoints
  const endpoint: EndpointWithExample | undefined = prompt.endpoints[0]
  // TODO allow publishing to other environments
  const flavor = prompt.availableFlavors[0]

  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()

  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()

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
      <div className='flex flex-col gap-4 p-8 text-gray-500 max-w-prose'>
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
        {endpoint && (
          <div className='flex flex-col gap-4 text-black whitespace-pre-wrap'>
            Try out your API endpoint by running:
            <pre>{endpoint.curlCommand}</pre>
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

function EmptyPublishTab() {
  return (
    <div className='flex flex-col items-center justify-center w-full p-8 m-8 bg-gray-100 rounded-lg'>
      <span className='font-medium text-gray-600'>Move your prompt to a Project before publishing it</span>
    </div>
  )
}
