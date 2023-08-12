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
import { CheckValidURLPath, StripPromptSentinels, ToCamelCase } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import PickNameDialog from './pickNameDialog'
import VersionSelector from './versionSelector'
import { useInitialState } from './useInitialState'
import useModalDialogPrompt from './modalDialogContext'
import TextInput from './textInput'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'
import { PendingButton } from './button'

export default function PublishSettingsPane({
  endpoint,
  project,
  prompt,
  onRefresh,
}: {
  endpoint: Endpoint
  project: ActiveProject
  prompt?: ActivePrompt
  onRefresh: () => Promise<void>
}) {
  const [isEnabled, setEnabled] = useInitialState(endpoint.enabled)
  const [parentID, setParentID] = useInitialState(endpoint.parentID)
  const [versionID, setVersionID] = useInitialState(endpoint.versionID)
  const [urlPath, setURLPath] = useInitialState(endpoint.urlPath)
  const [flavor, setFlavor] = useInitialState(endpoint.flavor)
  const [useCache, setUseCache] = useInitialState(endpoint.useCache)
  const [useStreaming, setUseStreaming] = useInitialState(endpoint.useStreaming)

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

  const [isSaving, setSaving] = useState(false)
  const saveChanges = () => {
    setDialogPrompt({
      title: 'Updating a published endpoint may break existing integrations',
      confirmTitle: 'Proceed',
      callback: async () => {
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
      <Label>{parent.name}</Label>
      <div className='grid w-full grid-cols-[160px_minmax(0,1fr)] items-center gap-4 p-6 py-4 bg-gray-50 rounded-lg'>
        <Label>Enabled</Label>
        <Checkbox checked={isEnabled} setChecked={setEnabled} />
        <Label>URL Path</Label>
        <TextInput value={urlPath} setValue={value => setURLPath(ToCamelCase(value))} />
        <Label>Environment</Label>
        <DropdownMenu value={flavor} onChange={updateFlavor}>
          {project.availableFlavors.map((flavor, index) => (
            <option key={index} value={flavor}>
              {flavor}
            </option>
          ))}
          <option value={addNewEnvironment} onClick={() => setShowPickNamePrompt(true)}>
            {addNewEnvironment}
          </option>
        </DropdownMenu>
        {
          <>
            <Label>Prompt / Chain</Label>
            <DropdownMenu value={parentID} onChange={value => updateParentID(Number(value))}>
              {parents.map((parent, index) => (
                <option key={index} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </DropdownMenu>
          </>
        }
        {prompt && versionIndex >= 0 && (
          <>
            <Label className='self-start mt-2'>Version</Label>
            <VersionSelector
              versions={versions}
              endpoints={project.endpoints}
              activeVersion={versions[versionIndex]}
              setActiveVersion={version => setVersionID(version.id)}
              labelColors={AvailableLabelColorsForPrompt(prompt)}
            />
            <div className='col-span-2 line-clamp-[9] overflow-y-auto border border-gray-200 p-3 rounded-lg text-gray-400'>
              {StripPromptSentinels(versions[versionIndex].prompt)}
            </div>
          </>
        )}
        <Label>Cache Responses</Label>
        <Checkbox checked={useCache} setChecked={setUseCache} />
        <Label>Stream Responses</Label>
        <Checkbox checked={useStreaming} setChecked={setUseStreaming} />
      </div>
      <div className='self-end'>
        <PendingButton disabled={isSaving || !CheckValidURLPath(urlPath)} onClick={saveChanges}>
          Save Changes
        </PendingButton>
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
