import { useState } from 'react'
import { ActiveChain, ChainItem } from '@/types'
import { useRefreshChain } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { PromptCache } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import EndpointsTable from './endpointsTable'
import { NewConfigFromEndpoints } from './publishPromptTab'

export default function PublishChainTab({
  items,
  chain,
  promptCache,
}: {
  items: ChainItem[]
  chain: ActiveChain
  promptCache: PromptCache
}) {
  const endpoints = chain.endpoints

  const [activeEndpointID, setActiveEndpointID] = useState(endpoints[0]?.id as number | undefined)
  const activeEndpoint = endpoints.find(endpoint => endpoint.id === activeEndpointID)

  if (activeEndpointID && !activeEndpoint) {
    setActiveEndpointID(undefined)
  } else if (!activeEndpointID && endpoints.length === 1) {
    setActiveEndpointID(endpoints[0].id)
  }

  const refreshChain = useRefreshChain()

  const addEndpoint = () => {
    const { name, flavor } = NewConfigFromEndpoints(endpoints, chain)
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
          <PublishSettingsPane activeItem={chain} endpoint={activeEndpoint} onRefresh={refreshChain} />
          {activeEndpoint.enabled && (
            <ExamplePane
              endpoint={activeEndpoint}
              variables={ExtractUnboundChainVariables(items, promptCache)}
              inputValues={chain.inputs}
              defaultFlavor={chain.availableFlavors[0]}
            />
          )}
          <UsagePane endpoint={activeEndpoint} onRefresh={refreshChain} />
        </div>
      )}
    </>
  )
}
