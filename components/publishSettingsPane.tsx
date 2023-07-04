import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivePrompt, ResolvedEndpoint, Version } from '@/types'
import api from '../src/client/api'
import useModalDialogPrompt from './modalDialogContext'
import { useRefreshPrompt } from './refreshContext'
import Label from './label'
import { CheckValidURLPath, ToCamelCase } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import TextInput from './textInput'
import { debounce } from 'debounce'
import PickNameDialog from './pickNameDialog'

export default function PublishSettingsPane({
  prompt,
  version,
  flavor,
  setFlavor,
}: {
  prompt: ActivePrompt
  version: Version
  flavor: string
  setFlavor: (flavor: string) => void
}) {
  const availableFlavors = prompt.availableFlavors
  const endpoints = prompt.endpoints
  const endpoint: ResolvedEndpoint | undefined = endpoints.find(endpoint => endpoint.flavor === flavor)

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const checkName = useMemo(
    () =>
      debounce((name: string) => api.checkEndpointName(prompt.id, prompt.projectURLPath, name).then(setNameAvailable)),
    [prompt]
  )

  const updateName = useCallback(
    (name: string) => {
      setName(name)
      setNameAvailable(undefined)
      if (CheckValidURLPath(name)) {
        checkName(name)
      } else {
        setNameAvailable(false)
      }
    },
    [checkName]
  )

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
      title:
        'Are you sure you want to unpublish this prompt? ' +
        'You will no longer be able to access the API and any usage statistics will be reset.',
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

  return (
    <>
        <Label>Settings</Label>
        <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
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
        {nameAvailable === false && name.length > 0 && (
          <div className='font-medium text-grey-500'>
            {CheckValidURLPath(name) ? 'Name already used for other prompt in project' : 'Invalid endpoint name'}
          </div>
        )}
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
  )
}
