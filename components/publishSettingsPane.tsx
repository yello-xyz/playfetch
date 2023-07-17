import { useState } from 'react'
import { ActiveChain, ActiveProject, ActivePrompt, Endpoint, Version } from '@/types'
import api from '../src/client/api'
import Label from './label'
import { StripPromptSentinels } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import PickNameDialog from './pickNameDialog'
import VersionSelector from './versionSelector'
import { EndpointToggleWithName } from './endpointsTable'
import { useInitialState } from './useInitialState'

export default function PublishSettingsPane({
  activeItem,
  endpoint,
  onRefresh,
}: {
  activeItem: ActivePrompt | ActiveChain
  endpoint: Endpoint
  onRefresh: () => Promise<void>
}) {
  const availableFlavors = activeItem.availableFlavors

  const [flavor, setFlavor] = useInitialState(endpoint.flavor)
  const [useCache, setUseCache] = useInitialState(endpoint.useCache)

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const toggleCache = (checked: boolean) => {
    setUseCache(checked)
    api.updateEndpoint({ ...endpoint, useCache: checked }).then(_ => onRefresh())
  }

  const addNewEnvironment = 'Add New Environment…'
  const updateFlavor = (flavor: string) => {
    if (flavor === addNewEnvironment) {
      setShowPickNamePrompt(true)
    } else {
      setFlavor(flavor)
      api.updateEndpoint({ ...endpoint, flavor }).then(_ => onRefresh())
    }
  }

  const addFlavor = async (flavor: string) => {
    await api.addFlavor(activeItem.projectID, flavor)
    await onRefresh()
    updateFlavor(flavor)
  }

  const isPrompt = (item: ActiveProject | ActiveChain): item is ActivePrompt => 'versions' in (item as ActivePrompt)
  const versions = isPrompt(activeItem) ? activeItem.versions : []
  const endpoints = isPrompt(activeItem) ? activeItem.endpoints : []
  const initialVersionID = endpoints.find(e => e.id === endpoint.id)?.versionID
  const [versionID, setVersionID] = useInitialState(initialVersionID)
  const versionIndex = versions.findIndex(version => version.id === versionID)

  const updateVersion = (version: Version) => {
    setVersionID(version.id)
    api.updateEndpoint({ ...endpoint, chain: [{ versionID: version.id }] }).then(_ => onRefresh())
  }

  return (
    <>
      <Label>{endpoint.urlPath}</Label>
      <div className='grid w-full grid-cols-[160px_minmax(0,1fr)] items-center gap-4 p-6 py-4 bg-gray-50 rounded-lg'>
        <Label>Enabled</Label>
        <EndpointToggleWithName endpoint={endpoint} onRefresh={onRefresh} />
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
