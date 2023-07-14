import { useState } from 'react'
import { ActivePrompt, ResolvedEndpoint, ResolvedPromptEndpoint, Version } from '@/types'
import { useRefreshPrompt } from './refreshContext'
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
  const endpoints = prompt.endpoints

  const initialActiveEndpoint = endpoints.find(endpoint => endpoint.versionID === activeVersion.id)
  const [activeEndpoint, setActiveEndpoint] = useState(initialActiveEndpoint)
  const version = prompt.versions.find(version => version.id === activeEndpoint?.versionID) ?? activeVersion

  const refreshPrompt = useRefreshPrompt()
  const refresh = () =>
    refreshPrompt().then(() => setActiveEndpoint(endpoints.find(endpoint => endpoint.id === activeEndpoint?.id)))

  // TODO implement Add Endpoint button
  const publish = async (name: string, flavor: string, useCache: boolean) =>
    api.publishPrompt(version.id, prompt.projectID, prompt.id, name, flavor, useCache).then(refresh)

  const endPointToVersionID = (endpoint: ResolvedEndpoint) => (endpoint as ResolvedPromptEndpoint).versionID

  const endpointToVersionIndex = (endpoint: ResolvedEndpoint) =>
    prompt.versions.findIndex(version => version.id === endPointToVersionID(endpoint))

  const updateActiveEndpoint = (endpoint: ResolvedEndpoint) => {
    setActiveEndpoint(endpoint as ResolvedPromptEndpoint)
    setActiveVersion(prompt.versions.find(version => version.id === endPointToVersionID(endpoint))!)
  }

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={updateActiveEndpoint}
          getVersionIndex={endpointToVersionIndex}
        />
      </div>
      {activeEndpoint && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[40%] overflow-y-auto'>
          <PublishSettingsPane activeItem={prompt} endpoint={activeEndpoint} onRefresh={refresh} />
          <UsagePane endpoint={activeEndpoint} />
          <ExamplePane
            endpoint={activeEndpoint}
            variables={ExtractPromptVariables(version.prompt)}
            inputValues={prompt.inputs}
            defaultFlavor={prompt.availableFlavors[0]}
          />
        </div>
      )}
    </>
  )
}
