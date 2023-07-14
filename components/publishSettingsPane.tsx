import { useCallback, useMemo, useState } from 'react'
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
  onRefresh,
}: {
  activeItem: ActivePrompt | ActiveProject
  endpoint: ResolvedEndpoint
  onRefresh: () => Promise<void>
}) {
  const projectID = 'projectID' in activeItem ? activeItem.projectID : activeItem.id
  const availableFlavors = activeItem.availableFlavors

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

  const [name, setName] = useState(endpoint.urlPath)
  const [nameAvailable, setNameAvailable] = useState<boolean>()

  const [flavor, setFlavor] = useState(endpoint.flavor)
  const [useCache, setUseCache] = useState(endpoint.useCache)

  const setDialogPrompt = useModalDialogPrompt()

  const togglePublish = () => {
    if (endpoint.enabled) {
      setDialogPrompt({
        title: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
        callback: () => api.toggleEndpoint(endpoint.id, false, endpoint.useCache).then(_ => onRefresh()),
        destructive: true,
      })
    } else {
      api.toggleEndpoint(endpoint.id, true, endpoint.useCache).then(_ => onRefresh())
    }
  }

  const toggleCache = (checked: boolean) => {
    setUseCache(checked)
    api.toggleEndpoint(endpoint.id, endpoint.enabled, checked).then(_ => onRefresh())
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
      <Label>{endpoint.urlPath}</Label>
      <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
        <Checkbox
          label='Enabled'
          id='enabled'
          disabled={!endpoint.enabled && !nameAvailable}
          checked={endpoint.enabled}
          setChecked={togglePublish}
        />
        <div className='flex items-center gap-8'>
          <Label className='w-32'>Name</Label>
          {endpoint.enabled ? (
            <div className='flex-1 text-right'>{name}</div>
          ) : (
            <TextInput value={name} setValue={name => updateName(ToCamelCase(name))} />
          )}
        </div>
        <div className='flex items-center gap-8'>
          <Label>Environment</Label>
          {endpoint.enabled ? (
            <div className='flex-1 text-right'>{flavor}</div>
          ) : (
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
          )}
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
