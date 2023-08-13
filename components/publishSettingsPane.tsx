import { useState } from 'react'
import {
  ActiveProject,
  ActivePrompt,
  Endpoint,
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

export default function PublishSettingsPane({
  endpoint,
  project,
  prompt,
  onCollapse,
  onRefresh,
}: {
  endpoint: Endpoint
  project: ActiveProject
  prompt?: ActivePrompt
  onCollapse: () => void
  onRefresh: () => Promise<void>
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

  const [isEditing, setEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)

  if (isDirty && !isSaving && !isEditing) {
    setEnabled(endpoint.enabled)
    setParentID(endpoint.parentID)
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

  const updateParentID = (parentID: number) => {
    const parent = FindParentInProject(parentID, project)
    const versionID = EndpointParentIsPrompt(parent) ? parent.lastVersionID : undefined
    setParentID(parentID)
    setVersionID(versionID)
  }

  const versions = prompt?.versions ?? []
  const versionIndex = versions.findIndex(version => version.id === versionID)

  const saveChanges = () => {
    setDialogPrompt({
      title: 'Updating a published endpoint may break existing integrations',
      confirmTitle: 'Proceed',
      callback: async () => {
        setEditing(false)
        setSaving(true)
        await api.updateEndpoint(endpoint.id, isEnabled, parentID, versionID, urlPath, flavor, useCache, useStreaming)
        await onRefresh()
        setSaving(false)
      },
      destructive: true,
    })
  }

  return (
    <>
      <div className='flex items-center justify-between w-full'>
        <Label>{`${parent.name}${versionIndex >= 0 ? ` (Version ${versionIndex + 1})` : ''}`}</Label>
        <IconButton icon={collapseIcon} onClick={onCollapse} />
      </div>
      <div className='grid w-full grid-cols-[160px_minmax(0,1fr)] items-center gap-4 p-6 py-4 bg-gray-50 rounded-lg'>
        <Label disabled={!isEditing}>Enabled</Label>
        <Checkbox disabled={!isEditing} checked={isEnabled} setChecked={setEnabled} />
        <Label disabled={!isEditing}>Prompt / Chain</Label>
        <DropdownMenu disabled={!isEditing} value={parentID} onChange={value => updateParentID(Number(value))}>
          {parents.map((parent, index) => (
            <option key={index} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </DropdownMenu>
        {prompt && versionIndex >= 0 && (
          <>
            <Label disabled={!isEditing} className='self-start mt-2'>
              Version
            </Label>
            <VersionSelector
              versions={versions}
              endpoints={project.endpoints}
              activeVersion={versions[versionIndex]}
              setActiveVersion={version => setVersionID(version.id)}
              labelColors={AvailableLabelColorsForPrompt(prompt)}
              disabled={!isEditing}
            />
          </>
        )}
        <Label disabled={!isEditing}>Name</Label>
        <TextInput disabled={!isEditing} value={urlPath} setValue={value => setURLPath(ToCamelCase(value))} />
        <Label disabled={!isEditing}>Environment</Label>
        <DropdownMenu disabled={!isEditing} value={flavor} onChange={updateFlavor}>
          {project.availableFlavors.map((flavor, index) => (
            <option key={index} value={flavor}>
              {flavor}
            </option>
          ))}
          <option value={addNewEnvironment} onClick={() => setShowPickNamePrompt(true)}>
            {addNewEnvironment}
          </option>
        </DropdownMenu>
        <Label disabled={!isEditing}>Cache Responses</Label>
        <Checkbox disabled={!isEditing} checked={useCache} setChecked={setUseCache} />
        <Label disabled={!isEditing}>Stream Responses</Label>
        <Checkbox disabled={!isEditing} checked={useStreaming} setChecked={setUseStreaming} />
        <div className='col-span-2 text-right'>
          {isEditing || isSaving ? (
            <div className='flex justify-end gap-2'>
              <Button type='outline' disabled={isSaving} onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <PendingButton disabled={!CheckValidURLPath(urlPath) || !isDirty || isSaving} onClick={saveChanges}>
                Save Changes
              </PendingButton>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit Endpoint</Button>
          )}
        </div>
      </div>
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
