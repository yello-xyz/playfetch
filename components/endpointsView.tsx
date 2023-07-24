import { useEffect, useState } from 'react'
import { ActiveProject, ActivePrompt, Chain, Endpoint, Prompt } from '@/types'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import EndpointsTable from './endpointsTable'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import { toActivePrompt } from '@/pages/[projectID]'

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

export default function EndpointsView({
  project,
  onRefresh,
}: {
  project: ActiveProject
  onRefresh: () => Promise<void>
}) {
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

  const addEndpoint =
    project.prompts.length > 0 || project.chains.length > 0
      ? () => {
          const prompt = project.prompts[0] as Prompt | undefined
          const parent = prompt ?? project.chains[0]
          const { name, flavor } = NewConfigFromEndpoints(endpoints, parent.name, project.availableFlavors)
          api.publishEndpoint(project.id, parent.id, prompt?.lastVersionID, name, flavor, false, false).then(onRefresh)
        }
      : undefined

  const parent = [...project.chains, ...project.prompts].find(item => item.id === activeEndpoint?.parentID)
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>()
  useEffect(() => {
    if (isPrompt(parent)) {
      api.getPromptVersions(parent.id).then(versions => setActivePrompt(toActivePrompt(parent.id, versions, project)))
    }
  }, [parent, project])

  const version = activePrompt?.versions?.find(version => version.id === activeEndpoint?.versionID)
  const inputs = isPrompt(parent) ? ExtractPromptVariables(version?.prompt ?? '') : parent?.inputs ?? []

  return (
    <div className='flex items-stretch h-full'>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          project={project}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={updateActiveEndpoint}
          onRefresh={onRefresh}
          onAddEndpoint={addEndpoint}
        />
      </div>
      {activeEndpoint && parent && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[460px] overflow-y-auto'>
          <PublishSettingsPane
            endpoint={activeEndpoint}
            project={project}
            versions={activePrompt?.versions}
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
