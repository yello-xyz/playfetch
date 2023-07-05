import { useState } from 'react'
import { ActiveProject, ProperProject, ResolvedEndpoint } from '@/types'
import { useRefreshProject } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { LoadedChainItem } from './chainTabView'
import { ExtractUnboundChainVariables } from './buildChainTab'

export default function PublishChainTab({
  chain,
  project,
}: {
  chain: LoadedChainItem[]
  project: ActiveProject & ProperProject
}) {
  const availableFlavors = project.availableFlavors
  const endpoints = project.endpoints
  const endpointFlavors = endpoints.map(endpoint => endpoint.flavor)
  const initialFlavor = availableFlavors.find(flavor => endpointFlavors.includes(flavor)) ?? availableFlavors[0]

  const [flavor, setFlavor] = useState(initialFlavor)

  const endpoint: ResolvedEndpoint | undefined = endpoints.find(endpoint => endpoint.flavor === flavor)

  const refreshProject = useRefreshProject()

  const publish = async (name: string, useCache: boolean) => {
    await api.publishChain(
      chain.map(item => ({ promptID: item.version.promptID, versionID: item.version.id, output: item.output })),
      project.id,
      name,
      flavor,
      useCache
    )
    refreshProject()
  }

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500 max-w-[50%]'>
        <PublishSettingsPane
          key={flavor}
          activeItem={project}
          flavor={flavor}
          setFlavor={setFlavor}
          onPublish={publish}
          onRefresh={refreshProject}
        />
        {endpoint && <UsagePane endpoint={endpoint} />}
      </div>
      <div className='flex flex-col items-start gap-4 p-6 pl-0'>
        {endpoint && (
          <ExamplePane
            endpoint={endpoint}
            variables={ExtractUnboundChainVariables(chain)}
            inputValues={project.inputs}
            defaultFlavor={availableFlavors[0]}
          />
        )}
      </div>
    </>
  )
}
