import { useState } from 'react'
import { Endpoint, Project, Prompt, Version, isProperProject } from '@/types'
import { PendingButton } from './button'
import { ExtractPromptVariables } from '@/common/formatting'
import api from './api'
import useModalDialogPrompt from './modalDialogContext'
import { useRefreshPrompt, useSavePrompt } from './refreshContext'
import PickNameDialog from './pickNameDialog'
import Label from './label'

export default function PublishPane({
  project,
  prompt,
  version,
  endpoint,
}: {
  project: Project
  prompt: Prompt
  version: Version
  endpoint?: Endpoint
}) {
  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)
  const [curlCommand, setCURLCommand] = useState<string>()
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const setDialogPrompt = useModalDialogPrompt()

  const savePrompt = useSavePrompt()
  const refreshPrompt = useRefreshPrompt()

  const publish = async (name: string) => {
    const lastRun = version.runs.slice(-1)[0]
    const inputState = lastRun?.inputs ?? {}
    const inputVariables = ExtractPromptVariables(version.prompt)
    const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

    await savePrompt()
    await api
      .publishPrompt(project!.id, prompt.id, name, version.prompt, version.config, inputs, useCache)
      .then(setCURLCommand)
    refreshPrompt()
  }

  const unpublish = () => {
    setDialogPrompt({
      title: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
      callback: async () => {
        setCURLCommand(undefined)
        await api.unpublishPrompt(prompt.id)
        refreshPrompt()
      },
      destructive: true,
    })
  }

  return (
    <>
      <div className='flex flex-col gap-4 px-8 pt-8 text-gray-500 max-w-prose'>
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
          {endpoint && <PendingButton onClick={unpublish}>Unpublish</PendingButton>}
        </div>
        {endpoint && (
          <div className='flex gap-2'>
            <div className='font-bold text-black'>
              Prompt published as <pre className='inline'>{`/${endpoint.projectURLPath}/${endpoint.urlPath}`}</pre>
            </div>{' '}
          </div>
        )}
        {curlCommand && (
          <div className='flex flex-col gap-4 text-black whitespace-pre-wrap'>
            Try out your API endpoint by running:
            <pre>{curlCommand}</pre>
          </div>
        )}
      </div>
      {showPickNamePrompt && isProperProject(project) && (
        <PickNameDialog
          title='Publish Prompt'
          confirmTitle='Publish'
          label='Endpoint'
          initialName={endpoint?.urlPath}
          validator={(name: string) => api.checkEndpointName(prompt.id, project.urlPath, name)}
          onConfirm={publish}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
