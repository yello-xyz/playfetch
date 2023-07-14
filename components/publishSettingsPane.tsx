import { useState } from 'react'
import { ActiveProject, ActivePrompt, ResolvedEndpoint, Version } from '@/types'
import api from '../src/client/api'
import useModalDialogPrompt from './modalDialogContext'
import Label from './label'
import { CheckValidURLPath, StripPromptSentinels, ToCamelCase } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import TextInput from './textInput'
import PickNameDialog from './pickNameDialog'
import VersionSelector from './versionSelector'

const updateEndpoint = (endpoint: ResolvedEndpoint) =>
  api.updateEndpoint(
    endpoint.id,
    endpoint.enabled,
    endpoint.chain,
    endpoint.urlPath,
    endpoint.flavor,
    endpoint.useCache
  )

export function EndpointToggle({
  endpoint,
  disabled,
  onRefresh,
}: {
  endpoint: ResolvedEndpoint
  disabled?: boolean
  onRefresh: () => Promise<void>
}) {
  const [isEnabled, setEnabled] = useState(endpoint.enabled)

  const [savedState, setSavedState] = useState(endpoint.enabled)
  if (endpoint.enabled !== savedState) {
    setEnabled(endpoint.enabled)
    setSavedState(endpoint.enabled)
  }

  const setDialogPrompt = useModalDialogPrompt()

  const togglePublish = (enabled: boolean) => {
    const callback = () => {
      setEnabled(enabled)
      updateEndpoint({ ...endpoint, enabled }).then(_ => onRefresh())
    }
    if (isEnabled) {
      setDialogPrompt({
        title: 'Are you sure you want to unpublish this prompt? You will no longer be able to access the API.',
        callback,
        destructive: true,
      })
    } else {
      callback()
    }
  }

  return <Checkbox disabled={disabled} checked={isEnabled} setChecked={togglePublish} />
}

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

  const [name, setName] = useState(endpoint.urlPath)
  const [flavor, setFlavor] = useState(endpoint.flavor)
  const [useCache, setUseCache] = useState(endpoint.useCache)

  const toggleCache = (checked: boolean) => {
    setUseCache(checked)
    updateEndpoint({ ...endpoint, useCache: checked }).then(_ => onRefresh())
  }

  const addNewEnvironment = 'Add New Environment…'
  const updateFlavor = (flavor: string) => {
    if (flavor === addNewEnvironment) {
      setShowPickNamePrompt(true)
    } else {
      setFlavor(flavor)
      updateEndpoint({ ...endpoint, flavor }).then(_ => onRefresh())
    }
  }

  const addFlavor = async (flavor: string) => {
    await api.addFlavor(projectID, flavor)
    await onRefresh()
    updateFlavor(flavor)
  }

  const isPrompt = (item: ActiveProject | ActivePrompt): item is ActivePrompt => 'versions' in (item as ActivePrompt)
  const versions = isPrompt(activeItem) ? activeItem.versions : []
  const endpoints = isPrompt(activeItem) ? activeItem.endpoints : []
  const [versionID, setVersionID] = useState(endpoints.find(e => e.id === endpoint.id)?.versionID)
  const versionIndex = versions.findIndex(version => version.id === versionID)

  const updateVersion = (version: Version) => {
    setVersionID(version.id)
    updateEndpoint({ ...endpoint, chain: [{ versionID: version.id }] }).then(_ => onRefresh())
  }

  return (
    <>
      <Label>{endpoint.urlPath}</Label>
      <div className='grid w-full grid-cols-[160px_minmax(0,1fr)] items-center gap-4 p-6 py-4 bg-gray-50 rounded-lg'>
        <Label>Enabled</Label>
        <EndpointToggle endpoint={endpoint} disabled={!CheckValidURLPath(name)} onRefresh={onRefresh} />
        <Label>Name</Label>
        {endpoint.enabled ? name : <TextInput value={name} setValue={name => setName(ToCamelCase(name))} />}
        <Label>Environment</Label>
        {endpoint.enabled ? (
          flavor
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
        {isPrompt(activeItem) && (
          <>
            <Label>Prompt</Label>
            {endpoint.enabled ? (
              `v${versionIndex + 1}`
            ) : (
              <VersionSelector
                versions={versions}
                endpoints={endpoints}
                activeVersion={versions[versionIndex]}
                setActiveVersion={updateVersion}
              />
            )}
            <div className='col-span-2 line-clamp-[9] overflow-y-auto border border-gray-200 p-3 rounded-lg text-gray-400'>
              {StripPromptSentinels(versions[versionIndex].prompt)}
            </div>
          </>
        )}
        <Label>Cache</Label>
        <Checkbox checked={useCache} setChecked={toggleCache} />
      </div>
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
