import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActiveProject, ActivePrompt, ResolvedEndpoint } from '@/types'
import api from '../src/client/api'
import useModalDialogPrompt from './modalDialogContext'
import Label from './label'
import { CheckValidURLPath, ToCamelCase } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import TextInput from './textInput'
import { debounce } from 'debounce'
import PickNameDialog from './pickNameDialog'

export default function PublishSettingsPane({
  activeItem,
  endpoint,
  onPublish,
  onRefresh,
}: {
  activeItem: ActivePrompt | ActiveProject
  endpoint?: ResolvedEndpoint
  onPublish: (name: string, flavor: string, useCache: boolean) => Promise<void>
  onRefresh: () => Promise<void>
}) {
  const projectID = 'projectID' in activeItem ? activeItem.projectID : activeItem.id
  const availableFlavors = activeItem.availableFlavors
  const endpoints = activeItem.endpoints

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const checkName = useMemo(
    () =>
      debounce((name: string) =>
        api.checkEndpointName(activeItem.id, activeItem.projectURLPath, name).then(setNameAvailable)
      ),
    [activeItem]
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
    endpoint?.urlPath ?? endpoints[0]?.urlPath ?? ToCamelCase(activeItem.name.split(' ').slice(0, 3).join(' '))
  const [name, setName] = useState(initialName)
  const [nameAvailable, setNameAvailable] = useState<boolean>()
  useEffect(() => updateName(initialName), [initialName, updateName])

  const [flavor, setFlavor] = useState(endpoint?.flavor ?? availableFlavors[0])
  const [useCache, setUseCache] = useState(endpoint?.useCache ?? false)

  const setDialogPrompt = useModalDialogPrompt()

  const unpublish = (endpointID: number) => {
    setDialogPrompt({
      title: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
      callback: async () => {
        await api.deleteEndpoint(endpointID)
        onRefresh()
      },
      destructive: true,
    })
  }

  const togglePublish = () => {
    if (endpoint) {
      unpublish(endpoint.id)
    } else {
      onPublish(name, flavor, useCache)
    }
  }

  const toggleCache = (checked: boolean) => {
    setUseCache(checked)
    if (endpoint) {
      api.toggleEndpoint(endpoint.id, endpoint.enabled, checked).then(_ => onRefresh())
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
    await api.addFlavor(projectID, flavor)
    await onRefresh()
    setFlavor(flavor)
  }

  return (
    <>
      <Label>{endpoint?.urlPath ?? 'Settings'}</Label>
      <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
        <Checkbox
          label='Enabled'
          id='publish'
          disabled={!endpoint && !nameAvailable}
          checked={!!endpoint}
          setChecked={togglePublish}
        />
        <div className='flex items-center gap-8'>
          <Label className='w-32'>Name</Label>
          {endpoint ? (
            <div className='flex-1 text-right'>{name}</div>
          ) : (
            <TextInput value={name} setValue={name => updateName(ToCamelCase(name))} />
          )}
        </div>
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
