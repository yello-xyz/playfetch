import { useEffect, useState } from 'react'
import { ActiveProject, ActivePrompt, Chain, Endpoint, Prompt } from '@/types'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import EndpointsTable from './endpointsTable'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'

const NewConfigFromEndpoints = (endpoints: Endpoint[], itemName: string, availableFlavors: string[]) => {
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

export default function EndpointsView({ project, onRefresh }: { project: ActiveProject; onRefresh: () => Promise<void> }) {
  const endpoints = project.endpoints
  const [activeEndpointID, setActiveEndpointID] = useState(endpoints[0]?.id as number | undefined)
  const activeEndpoint = endpoints.find(endpoint => endpoint.id === activeEndpointID)

  if (activeEndpointID && !activeEndpoint) {
    setActiveEndpointID(undefined)
  } else if (!activeEndpointID && endpoints.length === 1) {
    setActiveEndpointID(endpoints[0].id)
  }

  const updateActiveEndpoint = (endpoint: Endpoint) => {
    setActiveEndpointID(endpoint.id)
    if (endpoint.parentID !== activeEndpoint?.parentID) {
      setActivePrompt(undefined)
    }
  } 

  const isPrompt = (item: Chain | Prompt | undefined): item is Prompt => !!item && 'lastVersionID' in (item as Prompt)

  const addEndpoint = (item: Chain | Prompt) => {
    const { name, flavor } = NewConfigFromEndpoints(endpoints, item.name, project.availableFlavors)
    if (isPrompt(item)) {
      api.publishPrompt(item.lastVersionID, project.id, item.id, name, flavor, false, false).then(onRefresh)
    } else {
      api.publishChain(project.id, item.id, name, flavor, false, false).then(onRefresh)
    }
  }

  const activeItem = [...project.chains, ...project.prompts].find(item => item.id === activeEndpoint?.parentID)
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>()
  useEffect(() => {
    if (isPrompt(activeItem)) {
      api.getPrompt(activeItem.id).then(setActivePrompt)
    }
  }, [activeItem])

  const version = activePrompt?.versions?.find(version => version.id === activeEndpoint?.versionID)
  const inputs = isPrompt(activeItem) ? ExtractPromptVariables(version?.prompt ?? '') : activeItem?.inputs ?? []

  return (
    <div className='flex items-stretch h-full'>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          project={project}
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={updateActiveEndpoint}
          onRefresh={onRefresh}
          onAddEndpoint={addEndpoint}
        />
      </div>
      {activeEndpoint && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[460px] overflow-y-auto'>
          <PublishSettingsPane
            endpoint={activeEndpoint}
            projectID={project.id}
            versions={activePrompt?.versions}
            endpoints={endpoints}
            availableFlavors={project.availableFlavors}
            onRefresh={onRefresh}
          />
          {activeEndpoint.enabled && (
            <ExamplePane
              endpoint={activeEndpoint}
              inputs={inputs}
              inputValues={project.inputValues}
              defaultFlavor={project.availableFlavors[0]}
            />
          )}
          <UsagePane endpoint={activeEndpoint} onRefresh={onRefresh} />
        </div>
      )}
    </div>
  )
}
