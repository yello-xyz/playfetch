import { useState } from 'react'
import { ActiveChain } from '@/types'
import { useRefreshProject } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { LoadedChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import EndpointsTable from './endpointsTable'
import { NewConfigFromEndpoints } from './publishPromptTab'

export default function PublishChainTab({ chain, activeChain }: { chain: LoadedChainItem[]; activeChain: ActiveChain }) {
  const endpoints = activeChain.endpoints

  const [activeEndpointID, setActiveEndpointID] = useState(endpoints[0]?.id)
  const activeEndpoint = endpoints.find(endpoint => endpoint.id === activeEndpointID)

  const refreshProject = useRefreshProject()

  const addEndpoint = () => {
    const { name, flavor } = NewConfigFromEndpoints(endpoints, activeChain)
    api.publishChain(
      chain.map(item => ({
        versionID: item.version.id,
        output: item.output,
        includeContext: item.includeContext,
      })),
      activeChain.projectID,
      activeChain.id,
      name,
      flavor,
      false
    ).then(refreshProject)
  }

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={endpoint => setActiveEndpointID(endpoint.id)}
          onRefresh={refreshProject}
          onAddEndpoint={addEndpoint}
        />
      </div>
      {activeEndpoint && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[460px] overflow-y-auto'>
          <PublishSettingsPane activeItem={activeChain} endpoint={activeEndpoint} onRefresh={refreshProject} />
          {activeEndpoint.enabled && (
            <ExamplePane
              endpoint={activeEndpoint}
              variables={ExtractUnboundChainVariables(chain)}
              inputValues={activeChain.inputs}
              defaultFlavor={activeChain.availableFlavors[0]}
            />
          )}
          <UsagePane endpoint={activeEndpoint} onRefresh={refreshProject} />
        </div>
      )}
    </>
  )
}
