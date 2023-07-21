import { useState } from 'react'
import { ActiveProject, Chain } from '@/types'
import { useRefreshChain } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { ExtractUnboundChainVariables } from './buildChainTab'
import EndpointsTable from './endpointsTable'
import { NewConfigFromEndpoints } from './publishPromptTab'

export default function PublishChainTab({
  chain,
  project,
  variables,
}: {
  chain: Chain
  project: ActiveProject
  variables: string[]
}) {
  const endpoints = project.endpoints

  const [activeEndpointID, setActiveEndpointID] = useState(endpoints[0]?.id as number | undefined)
  const activeEndpoint = endpoints.find(endpoint => endpoint.id === activeEndpointID)

  if (activeEndpointID && !activeEndpoint) {
    setActiveEndpointID(undefined)
  } else if (!activeEndpointID && endpoints.length === 1) {
    setActiveEndpointID(endpoints[0].id)
  }

  const refreshChain = useRefreshChain()

  const addEndpoint = () => {
    const { name, flavor } = NewConfigFromEndpoints(endpoints, chain.name, project.availableFlavors)
    api.publishChain(chain.projectID, chain.id, name, flavor, false, false).then(refreshChain)
  }

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={endpoint => setActiveEndpointID(endpoint.id)}
          onRefresh={refreshChain}
          onAddEndpoint={addEndpoint}
        />
      </div>
      {activeEndpoint && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[460px] overflow-y-auto'>
          <PublishSettingsPane
            endpoint={activeEndpoint}
            projectID={project.id}
            availableFlavors={project.availableFlavors}
            onRefresh={refreshChain}
          />
          {activeEndpoint.enabled && (
            <ExamplePane
              endpoint={activeEndpoint}
              variables={variables}
              inputValues={project.inputs}
              defaultFlavor={project.availableFlavors[0]}
            />
          )}
          <UsagePane endpoint={activeEndpoint} onRefresh={refreshChain} />
        </div>
      )}
    </>
  )
}
