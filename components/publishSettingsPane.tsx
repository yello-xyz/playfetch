import { useState } from 'react'
import {
  ActiveProject,
  ActivePrompt,
  EndpointParentIsPrompt,
  EndpointParentsInProject,
  FindParentInProject,
} from '@/types'
import api from '../src/client/api'
import Label from './label'
import { CheckValidURLPath, ToCamelCase } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import PickNameDialog from './pickNameDialog'
import VersionSelector from './versionSelector'
import { useInitialState } from './useInitialState'
import useModalDialogPrompt from './modalDialogContext'
import TextInput from './textInput'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import Button, { PendingButton } from './button'
import collapseIcon from '@/public/collapse.svg'
import IconButton from './iconButton'

export type EditableEndpoint = {
  id: number | undefined
  enabled: boolean
  parentID: number
  versionID?: number
  urlPath: string
  flavor: string
  useCache: boolean
  useStreaming: boolean
}

export default function PublishSettingsPane({
  endpoint,
  project,
  prompt,
  onSelectParentID,
  isEditing,
  setEditing,
  onCollapse,
  onRefresh,
}: {
  endpoint: EditableEndpoint
  project: ActiveProject
  prompt?: ActivePrompt
  onSelectParentID: (parentID: number) => void
  isEditing: boolean
  setEditing: (isEditing: boolean) => void
  onCollapse?: () => void
  onRefresh: (newEndpointID?: number) => Promise<void>
}) {
  const [isEnabled, setEnabled] = useInitialState(endpoint.enabled)
  const [parentID, setParentID] = useInitialState(endpoint.parentID)
  const [versionID, setVersionID] = useInitialState(endpoint.versionID)
  const [urlPath, setURLPath] = useInitialState(endpoint.urlPath)
  const [flavor, setFlavor] = useInitialState(endpoint.flavor)
  const [useCache, setUseCache] = useInitialState(endpoint.useCache)
  const [useStreaming, setUseStreaming] = useInitialState(endpoint.useStreaming)

  const isDirty =
    isEnabled !== endpoint.enabled ||
    parentID !== endpoint.parentID ||
    versionID !== endpoint.versionID ||
    urlPath !== endpoint.urlPath ||
    flavor !== endpoint.flavor ||
    useCache !== endpoint.useCache ||
    useStreaming !== endpoint.useStreaming

  const [isSaving, setSaving] = useState(false)

  const updateParentID = (parentID: number) => {
    const parent = FindParentInProject(parentID, project)
    const versionID = EndpointParentIsPrompt(parent) ? parent.lastVersionID : undefined
    setParentID(parentID)
    setVersionID(versionID)
    onSelectParentID(parentID)
  }

  if (isDirty && !isEditing) {
    setEnabled(endpoint.enabled)
    updateParentID(endpoint.parentID)
    setVersionID(endpoint.versionID)
    setURLPath(endpoint.urlPath)
    setFlavor(endpoint.flavor)
    setUseCache(endpoint.useCache)
    setUseStreaming(endpoint.useStreaming)
  }

  const setDialogPrompt = useModalDialogPrompt()
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const addNewEnvironment = 'Add New Environment…'
  const updateFlavor = (flavor: string) => {
    if (flavor === addNewEnvironment) {
      setShowPickNamePrompt(true)
    } else {
      setFlavor(flavor)
    }
  }

  const addFlavor = async (flavor: string) => {
    await api.addFlavor(project.id, flavor)
    await onRefresh()
    updateFlavor(flavor)
  }

  const parents = EndpointParentsInProject(project)
  const parent = FindParentInProject(parentID, project)

  const versions = prompt?.versions ?? []
  const versionIndex = versions.findIndex(version => version.id === versionID)

  const publishEndpoint = async () => {
    setSaving(true)
    const newEndpointID = await api.publishEndpoint(
      isEnabled,
      project.id,
      parentID,
      versionID,
      urlPath,
      flavor,
      useCache,
      useStreaming
    )
    await onRefresh(newEndpointID)
    setSaving(false)
    setEditing(false)
  }

  const saveChanges = () => {
    setDialogPrompt({
      title: 'Updating a published endpoint may break existing integrations',
      confirmTitle: 'Proceed',
      callback: async () => {
        setSaving(true)
        await api.updateEndpoint(endpoint.id!, isEnabled, parentID, versionID, urlPath, flavor, useCache, useStreaming)
        await onRefresh()
        setSaving(false)
        setEditing(false)
      },
      destructive: true,
    })
  }

  const deleteEndpoint = () => {
    setDialogPrompt({
      title:
        'Are you sure you want to delete this endpoint? ' +
        `You will no longer be able to access ${endpoint.enabled ? 'the API or ' : ''}usage data.`,
      callback: async () => {
        setSaving(true)
        await api.deleteEndpoint(endpoint.id!)
        await onRefresh()
        setSaving(false)
        setEditing(false)
      },
      destructive: true,
    })
  }

  const disabled = !isEditing || isSaving

  return (
    <>
      <div className='flex items-center justify-between w-full -mb-4'>
        <Label>
          {endpoint.id ? `${parent.name}${versionIndex >= 0 ? ` (Version ${versionIndex + 1})` : ''}` : 'New Endpoint'}
        </Label>
        {onCollapse && <IconButton icon={collapseIcon} onClick={onCollapse} />}
      </div>
      <div className='grid w-full grid-cols-[160px_minmax(0,1fr)] items-center gap-4 p-6 py-4 bg-gray-50 rounded-lg'>
        <Label disabled={disabled}>Enabled</Label>
        <Checkbox disabled={disabled} checked={isEnabled} setChecked={setEnabled} />
        <Label disabled={disabled}>Prompt / Chain</Label>
        <DropdownMenu disabled={disabled} value={parentID} onChange={value => updateParentID(Number(value))}>
          {parents.map((parent, index) => (
            <option key={index} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </DropdownMenu>
        {prompt && versionIndex >= 0 && (
          <>
            <Label disabled={disabled} className='self-start mt-2'>
              Version
            </Label>
            <VersionSelector
              versions={versions}
              endpoints={project.endpoints}
              activeVersion={versions[versionIndex]}
              setActiveVersion={version => setVersionID(version.id)}
              labelColors={AvailableLabelColorsForPrompt(prompt)}
              disabled={disabled}
            />
          </>
        )}
        <Label disabled={disabled}>Name</Label>
        <TextInput
          placeholder='endpointName'
          disabled={disabled}
          value={urlPath}
          setValue={value => setURLPath(ToCamelCase(value))}
        />
        <Label disabled={disabled}>Environment</Label>
        <DropdownMenu disabled={disabled} value={flavor} onChange={updateFlavor}>
          {project.availableFlavors.map((flavor, index) => (
            <option key={index} value={flavor}>
              {flavor}
            </option>
          ))}
          <option value={addNewEnvironment} onClick={() => setShowPickNamePrompt(true)}>
            {addNewEnvironment}
          </option>
        </DropdownMenu>
        <Label disabled={disabled}>Cache Responses</Label>
        <Checkbox disabled={disabled} checked={useCache} setChecked={setUseCache} />
        <Label disabled={disabled}>Stream Responses</Label>
        <Checkbox disabled={disabled} checked={useStreaming} setChecked={setUseStreaming} />
        <div className='col-span-2 text-right'>
          {!isEditing && <Button onClick={() => setEditing(true)}>Edit Endpoint</Button>}
        </div>
      </div>
      {isEditing && endpoint.id && (
        <>
          <Label className='-mb-4'>Danger zone</Label>
          <div className='flex items-center justify-between w-full p-4 border border-gray-200 rounded-lg'>
            <div className='flex flex-col'>
              <span>Delete this endpoint</span>
              <span className='text-xs text-gray-400'>
                Deleting an endpoint may break existing integrations. Please be certain.
              </span>
            </div>
            <Button type='destructive' onClick={deleteEndpoint}>
              Delete Endpoint
            </Button>
          </div>
        </>
      )}
      {isEditing && (
        <div className='flex justify-end w-full gap-2'>
          <Button type='outline' disabled={isSaving} onClick={() => setEditing(false)}>
            Cancel
          </Button>
          {endpoint.id ? (
            <PendingButton disabled={!CheckValidURLPath(urlPath) || !isDirty || isSaving} onClick={saveChanges}>
              Save Changes
            </PendingButton>
          ) : (
            <PendingButton disabled={!CheckValidURLPath(urlPath) || isSaving} onClick={publishEndpoint}>
              Create Endpoint
            </PendingButton>
          )}
        </div>
      )}
      {showPickNamePrompt && (
        <PickNameDialog
          title='Add Project Environment'
          confirmTitle='Add'
          label='Name'
          initialName={project.availableFlavors.includes('production') ? '' : 'production'}
          onConfirm={addFlavor}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
