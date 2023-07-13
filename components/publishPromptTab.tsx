import { useState } from 'react'
import { ActivePrompt, ResolvedPromptEndpoint, Version } from '@/types'
import { useRefreshPrompt, useSelectTab } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { ExtractPromptVariables } from '@/src/common/formatting'
import EndpointsTable from './endpointsTable'

export default function PublishPromptTab({
  prompt,
  activeVersion,
  setActiveVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const availableFlavors = prompt.availableFlavors
  const endpoints = prompt.endpoints
  const endpointFlavors = endpoints.map(endpoint => endpoint.flavor)
  const flavorOfActiveVersion = endpoints.find(endpoint => endpoint.versionID === activeVersion.id)?.flavor
  const initialFlavor =
    flavorOfActiveVersion ?? availableFlavors.find(flavor => endpointFlavors.includes(flavor)) ?? availableFlavors[0]

  const [flavor, setFlavor] = useState(initialFlavor)

  const endpoint: ResolvedPromptEndpoint | undefined = endpoints.find(endpoint => endpoint.flavor === flavor)
  const version = prompt.versions.find(version => version.id === endpoint?.versionID) ?? activeVersion

  const selectTab = useSelectTab()

  const switchToPublishedVersion = () => {
    setActiveVersion(version)
    selectTab('play')
  }

  const refreshPrompt = useRefreshPrompt()

  const publish = async (name: string, flavor: string, useCache: boolean) => {
    await api.publishPrompt(version.id, prompt.projectID, prompt.id, name, flavor, useCache)
    refreshPrompt()
  }

  const [activeEndpoint, setActiveEndpoint] = useState<ResolvedPromptEndpoint>()

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          prompt={prompt}
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={setActiveEndpoint}
        />
      </div>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[35%] overflow-y-auto'>
        <PublishSettingsPane
          activeItem={prompt}
          endpoint={endpoint}
          onPublish={publish}
          onRefresh={refreshPrompt}
        />
        {version.id !== activeVersion.id && (
          <div className='font-medium underline cursor-pointer text-grey-500' onClick={switchToPublishedVersion}>
            Switch to published version
          </div>
        )}
        {endpoint && <UsagePane endpoint={endpoint} />}
        {endpoint && (
          <ExamplePane
            endpoint={endpoint}
            variables={ExtractPromptVariables(version.prompt)}
            inputValues={prompt.inputs}
            defaultFlavor={availableFlavors[0]}
          />
        )}
      </div>
    </>
  )
}
