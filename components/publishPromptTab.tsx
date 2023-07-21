import { useState } from 'react'
import {
  ActiveProject,
  ActivePrompt,
  Endpoint,
  Prompt,
  ResolvedEndpoint,
  ResolvedPromptEndpoint,
  Version,
} from '@/types'
import { useRefreshPrompt } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import EndpointsTable from './endpointsTable'

export const NewConfigFromEndpoints = (endpoints: Endpoint[], itemName: string, availableFlavors: string[]) => {
  for (const existingName of endpoints.map(endpoint => endpoint.urlPath)) {
    const otherEndpointsWithName = endpoints.filter(endpoint => endpoint.urlPath === existingName)
    const existingFlavors = otherEndpointsWithName.map(endpoint => endpoint.flavor)
    const availableFlavor = availableFlavors.find(flavor => !existingFlavors.includes(flavor))
    if (availableFlavor) {
      return { name: existingName, flavor: availableFlavor }
    }
  }
  return {
    name: ToCamelCase(itemName.split(' ').slice(0, 3).join(' ')),
    flavor: availableFlavors[0],
  }
}

export default function PublishPromptTab({
  endpoints,
  prompt,
  project,
  activePrompt,
}: {
  endpoints: ResolvedEndpoint[]
  prompt: Prompt
  project: ActiveProject
  activePrompt?: ActivePrompt
}) {
  const [activeEndpointID, setActiveEndpointID] = useState(endpoints[0]?.id as number | undefined)
  const activeEndpoint = endpoints.find(endpoint => endpoint.id === activeEndpointID)

  const refreshPrompt = useRefreshPrompt()

  const addEndpoint = () => {
    const { name, flavor } = NewConfigFromEndpoints(endpoints, prompt.name, project.availableFlavors)
    api.publishPrompt(prompt.lastVersionID, project.id, prompt.id, name, flavor, false, false).then(refreshPrompt)
  }

  const endpointToVersionIndex = activePrompt
    ? (endpoint: Endpoint) =>
        activePrompt.versions.findIndex(version => version.id === (endpoint as ResolvedPromptEndpoint).versionID)
    : undefined

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={endpoint => setActiveEndpointID(endpoint.id)}
          onRefresh={refreshPrompt}
          onAddEndpoint={addEndpoint}
          getVersionIndex={endpointToVersionIndex}
        />
      </div>
      {activeEndpoint && activePrompt && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[460px] overflow-y-auto'>
          <PublishSettingsPane
            endpoint={activeEndpoint}
            projectID={project.id}
            versions={activePrompt.versions}
            promptEndpoints={endpoints as ResolvedPromptEndpoint[]}
            availableFlavors={project.availableFlavors}
            onRefresh={refreshPrompt}
          />
          {activeEndpoint.enabled && (
            <ExamplePane
              endpoint={activeEndpoint}
              inputs={ExtractPromptVariables(
                activePrompt.versions.find(v => v.id === activeEndpoint.versionID)!.prompt
              )}
              inputValues={project.inputValues}
              defaultFlavor={project.availableFlavors[0]}
            />
          )}
          <UsagePane endpoint={activeEndpoint} onRefresh={refreshPrompt} />
        </div>
      )}
    </>
  )
}
