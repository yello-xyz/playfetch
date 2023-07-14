import { useState } from 'react'
import { ActiveProject, ActivePrompt, Endpoint, ResolvedPromptEndpoint, Version } from '@/types'
import { useRefreshPrompt } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import EndpointsTable from './endpointsTable'

export const NewConfigFromEndpoints = (endpoints: Endpoint[], activeItem: ActivePrompt | ActiveProject) => {
  const availableFlavors = activeItem.availableFlavors
  for (const existingName of endpoints.map(endpoint => endpoint.urlPath)) {
    const otherEndpointsWithName = endpoints.filter(endpoint => endpoint.urlPath === existingName)
    const existingFlavors = otherEndpointsWithName.map(endpoint => endpoint.flavor)
    const availableFlavor = availableFlavors.find(flavor => !existingFlavors.includes(flavor))
    if (availableFlavor) {
      return { name: existingName, flavor: availableFlavor }
    }
  }
  return {
    name: ToCamelCase(activeItem.name.split(' ').slice(0, 3).join(' ')),
    flavor: availableFlavors[0],
  }
}

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
  const [activeEndpointID, setActiveEndpointID] = useState(initialActiveEndpoint?.id)
  const activeEndpoint = endpoints.find(endpoint => endpoint.id === activeEndpointID)
  const version = prompt.versions.find(version => version.id === activeEndpoint?.versionID) ?? activeVersion

  const refreshPrompt = useRefreshPrompt()

  const addEndpoint = () => {
    const { name, flavor } = NewConfigFromEndpoints(endpoints, prompt)
    api.publishPrompt(version.id, prompt.projectID, prompt.id, name, flavor, false).then(refreshPrompt)
  }

  const endPointToVersionID = (endpoint: Endpoint) => (endpoint as ResolvedPromptEndpoint).versionID

  const endpointToVersionIndex = (endpoint: Endpoint) =>
    prompt.versions.findIndex(version => version.id === endPointToVersionID(endpoint))

  const updateActiveEndpoint = (endpoint: Endpoint) => {
    setActiveEndpointID(endpoint.id)
    setActiveVersion(prompt.versions.find(version => version.id === endPointToVersionID(endpoint))!)
  }

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={updateActiveEndpoint}
          onRefresh={refreshPrompt}
          onAddEndpoint={addEndpoint}
          getVersionIndex={endpointToVersionIndex}
        />
      </div>
      {activeEndpoint && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[460px] overflow-y-auto'>
          <PublishSettingsPane activeItem={prompt} endpoint={activeEndpoint} onRefresh={refreshPrompt} />
          {activeEndpoint.enabled && (
            <ExamplePane
              endpoint={activeEndpoint}
              variables={ExtractPromptVariables(version.prompt)}
              inputValues={prompt.inputs}
              defaultFlavor={prompt.availableFlavors[0]}
            />
          )}
          <UsagePane endpoint={activeEndpoint} onRefresh={refreshPrompt} />
        </div>
      )}
    </>
  )
}
