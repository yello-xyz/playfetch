import { useState } from 'react'
import { ActiveProject, Endpoint, Version } from '@/types'
import api from '../src/client/api'
import Label from './label'
import { CheckValidURLPath, StripPromptSentinels, ToCamelCase } from '@/src/common/formatting'
import Checkbox from './checkbox'
import DropdownMenu from './dropdownMenu'
import PickNameDialog from './pickNameDialog'
import VersionSelector from './versionSelector'
import { PublishToggle } from './endpointsTable'
import { useInitialState } from './useInitialState'
import useModalDialogPrompt from './modalDialogContext'
import TextInput from './textInput'
import IconButton from './iconButton'
import enterIcon from '@/public/enter.svg'
import enterDisabledIcon from '@/public/enterDisabled.svg'

export default function PublishSettingsPane({
  endpoint,
  project,
  versions,
  availableFlavors,
  onRefresh,
}: {
  endpoint: Endpoint
  project: ActiveProject
  versions?: Version[]
  availableFlavors: string[]
  onRefresh: () => Promise<void>
}) {
  const [flavor, setFlavor] = useInitialState(endpoint.flavor)
  const [useCache, setUseCache] = useInitialState(endpoint.useCache)
  const [useStreaming, setUseStreaming] = useInitialState(endpoint.useStreaming)

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const toggleCache = (checked: boolean) => {
    setUseCache(checked)
    api.updateEndpoint({ ...endpoint, useCache: checked }).then(_ => onRefresh())
  }

  const toggleStreaming = (checked: boolean) => {
    setUseStreaming(checked)
    api.updateEndpoint({ ...endpoint, useStreaming: checked }).then(_ => onRefresh())
  }

  const setDialogPrompt = useModalDialogPrompt()

  const showUpdatePrompt = (callback: () => void) => {
    if (endpoint.enabled) {
      setDialogPrompt({
        title: 'Updating a published endpoint may break existing integrations',
        confirmTitle: 'Proceed',
        callback,
        destructive: true,
      })
    } else {
      callback()
    }
  }

  const addNewEnvironment = 'Add New Environment…'
  const updateFlavor = (flavor: string) => {
    if (flavor === addNewEnvironment) {
      setShowPickNamePrompt(true)
    } else {
      showUpdatePrompt(() => {
        setFlavor(flavor)
        api.updateEndpoint({ ...endpoint, flavor }).then(_ => onRefresh())
      })
    }
  }

  const addFlavor = async (flavor: string) => {
    await api.addFlavor(project.id, flavor)
    await onRefresh()
    updateFlavor(flavor)
  }

  const [versionID, setVersionID] = useInitialState(endpoint.versionID)
  const versionIndex = versions?.findIndex(version => version.id === versionID)

  const updateVersion = (version: Version) => {
    showUpdatePrompt(() => {
      setVersionID(version.id)
      api.updateEndpoint({ ...endpoint, versionID: version.id }).then(_ => onRefresh())
    })
  }

  const [urlPath, setURLPath] = useInitialState(endpoint.urlPath)
  const canUpdateURLPath = urlPath !== endpoint.urlPath && CheckValidURLPath(urlPath)
  const updateURLPath = () => {
    showUpdatePrompt(() => {
      api.updateEndpoint({ ...endpoint, urlPath }).then(_ => onRefresh())
    })
  }

  const parents = [...project.prompts, ...project.chains]
  const parent = parents.find(item => item.id === endpoint.parentID)!

  return (
    <>
      <Label>{parent.name}</Label>
      <div className='grid w-full grid-cols-[160px_minmax(0,1fr)] items-center gap-4 p-6 py-4 bg-gray-50 rounded-lg'>
        <Label>Enabled</Label>
        <PublishToggle endpoint={endpoint} onRefresh={onRefresh} />
        <Label>URL Path</Label>
        <div className='flex items-center gap-2'>
          <TextInput value={urlPath} setValue={value => setURLPath(ToCamelCase(value))} />
          <IconButton
            disabled={!canUpdateURLPath}
            icon={canUpdateURLPath ? enterIcon : enterDisabledIcon}
            onClick={updateURLPath}
          />
        </div>
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
        {versions && !!versionIndex && versionIndex >= 0 && (
          <>
            <Label>Version</Label>
            <VersionSelector
              versions={versions}
              endpoints={project.endpoints}
              activeVersion={versions[versionIndex]}
              setActiveVersion={updateVersion}
            />
            <div className='col-span-2 line-clamp-[9] overflow-y-auto border border-gray-200 p-3 rounded-lg text-gray-400'>
              {StripPromptSentinels(versions[versionIndex].prompt)}
            </div>
          </>
        )}
        <Label>Cache Responses</Label>
        <Checkbox checked={useCache} setChecked={toggleCache} />
        <Label>Stream Responses</Label>
        <Checkbox checked={useStreaming} setChecked={toggleStreaming} />
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
