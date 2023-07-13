import { useState } from 'react'
import { ActivePrompt, Version } from '@/types'
import { useRefreshPrompt } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import { ExtractPromptVariables } from '@/src/common/formatting'
import EndpointsTable from './endpointsTable'

export default function PublishPromptTab({ prompt, activeVersion }: { prompt: ActivePrompt; activeVersion: Version }) {
  const endpoints = prompt.endpoints

  const initialActiveEndpoint = endpoints.find(endpoint => endpoint.versionID === activeVersion.id)
  const [activeEndpoint, setActiveEndpoint] = useState(initialActiveEndpoint)
  const version = prompt.versions.find(version => version.id === activeEndpoint?.versionID) ?? activeVersion

  const refreshPrompt = useRefreshPrompt()

  const publish = async (name: string, flavor: string, useCache: boolean) => {
    await api.publishPrompt(version.id, prompt.projectID, prompt.id, name, flavor, useCache)
    refreshPrompt()
  }

  return (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
        <EndpointsTable
          prompt={prompt}
          endpoints={endpoints}
          activeEndpoint={activeEndpoint}
          setActiveEndpoint={setActiveEndpoint}
        />
      </div>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 pl-0 max-w-[35%] overflow-y-auto'>
        <PublishSettingsPane
          activeItem={prompt}
          endpoint={activeEndpoint}
          onPublish={publish}
          onRefresh={refreshPrompt}
        />
        {activeEndpoint && <UsagePane endpoint={activeEndpoint} />}
        {activeEndpoint && (
          <ExamplePane
            endpoint={activeEndpoint}
            variables={ExtractPromptVariables(version.prompt)}
            inputValues={prompt.inputs}
            defaultFlavor={prompt.availableFlavors[0]}
          />
        )}
      </div>
    </>
  )
}
