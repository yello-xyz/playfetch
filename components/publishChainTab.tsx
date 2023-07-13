import { useState } from 'react'
import { ActiveProject } from '@/types'
import { useRefreshProject } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { LoadedChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'
import EndpointsTable from './endpointsTable'

export default function PublishChainTab({ chain, project }: { chain: LoadedChainItem[]; project: ActiveProject }) {
  const endpoints = project.endpoints

  const [activeEndpoint, setActiveEndpoint] = useState(endpoints[0])

  const refreshProject = useRefreshProject()

  const publish = async (name: string, flavor: string, useCache: boolean) => {
    await api.publishChain(
      chain.map(item => ({
        promptID: item.version.promptID,
        versionID: item.version.id,
        output: item.output,
        includeContext: item.includeContext,
      })),
      project.id,
      name,
      flavor,
      useCache
    )
    refreshProject()
  }

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable endpoints={endpoints} activeEndpoint={activeEndpoint} setActiveEndpoint={setActiveEndpoint} />
      </div>
      {activeEndpoint && (
        <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[40%] overflow-y-auto'>
          <PublishSettingsPane
            activeItem={project}
            endpoint={activeEndpoint}
            onPublish={publish}
            onRefresh={refreshProject}
          />
          <UsagePane endpoint={activeEndpoint} />
          <ExamplePane
            endpoint={activeEndpoint}
            variables={ExtractUnboundChainVariables(chain)}
            inputValues={project.inputs}
            defaultFlavor={project.availableFlavors[0]}
          />
        </div>
      )}
    </>
  )
}
