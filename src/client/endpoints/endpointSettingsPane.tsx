import { useEffect, useState } from 'react'
import { ActiveChain, ActivePrompt } from '@/types'
import api from '@/src/client/api'
import Label from '../components/label'
import { CheckValidURLPath, ToCamelCase } from '@/src/common/formatting'
import Checkbox from '../components/checkbox'
import DropdownMenu from '../components/dropdownMenu'
import PickNameDialog from '../components/pickNameDialog'
import VersionSelector from '../versions/versionSelector'
import useInitialState from '@/src/client/components/useInitialState'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import TextInput from '../components/textInput'
import Button, { PendingButton } from '../components/button'
import ProjectItemSelector from '../projects/projectItemSelector'
import { useActiveProject } from '@/src/client/projects/projectContext'

export type EndpointSettings = {
  id: number | undefined
  enabled: boolean
  parentID?: number
  versionID?: number
  urlPath: string
  flavor?: string
  useCache: boolean
  useStreaming: boolean
}

export default function EndpointSettingsPane({
  endpoint,
  activeParent,
  onSelectParentID,
  onSelectVersionIndex,
  isEditing,
  setEditing,
  onRefresh,
}: {
  endpoint: EndpointSettings
  activeParent?: ActivePrompt | ActiveChain
  onSelectParentID: (parentID?: number) => void
  onSelectVersionIndex: (versionIndex: number) => void
  isEditing: boolean
  setEditing: (isEditing: boolean) => void
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

  const updateParentID = (parentID?: number) => {
    setParentID(parentID)
    setVersionID(undefined)
    onSelectParentID(parentID)
  }

  if (isDirty && !isEditing) {
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

  const activeProject = useActiveProject()

  const addFlavor = async (flavor: string) => {
    await api.addFlavor(activeProject.id, flavor)
    await onRefresh()
    updateFlavor(flavor)
  }

  const versions = activeParent?.versions ?? []
  const versionIndex = versions.findIndex(version => version.id === versionID)

  useEffect(() => onSelectVersionIndex(versionIndex), [onSelectVersionIndex, versionIndex])

  const publishEndpoint = async () => {
    setSaving(true)
    const newEndpointID = await api.publishEndpoint(
      isEnabled,
      activeProject.id,
      parentID!,
      versionID!,
      urlPath,
      flavor!,
      useCache,
      useStreaming
    )
    await onRefresh(newEndpointID)
    setSaving(false)
    setEditing(false)
  }

  const saveChanges = () =>
    setDialogPrompt({
      title: 'Updating a published endpoint may break existing integrations',
      confirmTitle: 'Proceed',
      callback: async () => {
        setSaving(true)
        await api.updateEndpoint(
          endpoint.id!,
          isEnabled,
          parentID!,
          versionID!,
          urlPath,
          flavor!,
          useCache,
          useStreaming
        )
        await onRefresh()
        setSaving(false)
        setEditing(false)
      },
      destructive: true,
    })

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
  const isValidConfig = !!parentID && !!versionID && !!flavor && CheckValidURLPath(urlPath)

  const gridConfig = 'grid grid-cols-[160px_minmax(0,1fr)]'
  return (
    <>
      <div
        className={`${gridConfig} w-full items-center gap-3 p-4 pt-4 pb-2 bg-white border-gray-200 border rounded-lg`}>
        <Label disabled={disabled}>Enabled</Label>
        <Checkbox disabled={disabled} checked={isEnabled} setChecked={setEnabled} />
        <Label disabled={disabled}>Prompt / Chain</Label>
        <ProjectItemSelector
          fixedWidth
          disabled={disabled}
          project={activeProject}
          items={[...activeProject.prompts, ...activeProject.chains]}
          selectedItemID={parentID}
          onSelectItemID={updateParentID}
        />
        <Label disabled={disabled} className='self-start mt-2'>
          Version
        </Label>
        <VersionSelector
          projectItem={activeParent}
          selectedVersionID={versionID}
          onSelectVersionID={setVersionID}
          hideEndpointReferences
          fixedWidth
          disabled={disabled}
        />
        <Label disabled={disabled}>Name</Label>
        <TextInput
          placeholder='endpointName'
          disabled={disabled}
          value={urlPath}
          setValue={value => setURLPath(ToCamelCase(value))}
        />
        <Label disabled={disabled}>Environment</Label>
        <DropdownMenu disabled={disabled} value={flavor ?? 0} onChange={updateFlavor}>
          {!flavor && <option value={0}>Select environment</option>}
          {activeProject.availableFlavors.map((flavor, index) => (
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
        <div className='flex justify-end col-span-2'>
          {!isEditing && <Button onClick={() => setEditing(true)}>Edit Endpoint</Button>}
        </div>
      </div>
      {isEditing && endpoint.id && (
        <>
          <Label className='-mb-4'>Danger zone</Label>
          <div className='flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg'>
            <div className='flex flex-col gap-1'>
              <span>Delete this endpoint</span>
              <span className='text-sm text-gray-400'>
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
          <Button type='secondary' disabled={isSaving} onClick={() => setEditing(false)}>
            Cancel
          </Button>
          {endpoint.id ? (
            <PendingButton
              title='Save Changes'
              disabled={!isValidConfig || !isDirty || isSaving}
              onClick={saveChanges}
            />
          ) : (
            <PendingButton title='Create Endpoint' disabled={!isValidConfig || isSaving} onClick={publishEndpoint} />
          )}
        </div>
      )}
      {showPickNamePrompt && (
        <PickNameDialog
          title='Add Project Environment'
          confirmTitle='Add'
          label='Name'
          initialName={activeProject.availableFlavors.includes('production') ? '' : 'production'}
          onConfirm={addFlavor}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
