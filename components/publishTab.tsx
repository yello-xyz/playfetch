import { useState } from 'react'
import { ActivePrompt, ResolvedEndpoint, Version } from '@/types'
import { useRefreshPrompt, useSelectTab } from './refreshContext'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'

export default function PublishTab({
  prompt,
  activeVersion,
  setActiveVersion,
}: {
  prompt: ActivePrompt
  activeVersion: Version
  setActiveVersion: (version: Version) => void
}) {
  const availableFlavors = prompt.availableFlavors
  const endpoints = prompt.endpoints
  const endpointFlavors = endpoints.map(endpoint => endpoint.flavor)
  const flavorOfActiveVersion = endpoints.find(endpoint => endpoint.versionID === activeVersion.id)?.flavor
  const initialFlavor =
    flavorOfActiveVersion ?? availableFlavors.find(flavor => endpointFlavors.includes(flavor)) ?? availableFlavors[0]

  const [flavor, setFlavor] = useState(initialFlavor)

  const endpoint: ResolvedEndpoint | undefined = endpoints.find(endpoint => endpoint.flavor === flavor)
  const version = prompt.versions.find(version => version.id === endpoint?.versionID) ?? activeVersion

  const selectTab = useSelectTab()

  const switchToPublishedVersion = () => {
    setActiveVersion(version)
    selectTab('play')
  }

  const refreshPrompt = useRefreshPrompt()

  const publish = async (name: string, useCache: boolean) => {
    await api.publishPrompt(
      prompt.projectID,
      prompt.id,
      version.id,
      name,
      flavor,
      version.prompt,
      version.config,
      useCache
    )
    refreshPrompt()
  }

  const publishingDisabled = version.runs.length === 0

  return availableFlavors.length > 0 ? (
    <>
      <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500 max-w-[50%]'>
        <PublishSettingsPane
          key={flavor}
          prompt={prompt}
          flavor={flavor}
          setFlavor={setFlavor}
          onPublish={publish}
          publishingDisabled={publishingDisabled}
        />
        {version.id !== activeVersion.id && (
          <div className='font-medium underline cursor-pointer text-grey-500' onClick={switchToPublishedVersion}>
            Switch to published version
          </div>
        )}
        {publishingDisabled && (
          <div className='font-medium underline cursor-pointer text-grey-500' onClick={() => selectTab('test')}>
            Test version before publishing
          </div>
        )}
        {endpoint && <UsagePane endpoint={endpoint} />}
      </div>
      <div className='flex flex-col items-start gap-4 p-6 pl-0'>
        {endpoint && (
          <ExamplePane endpoint={endpoint} exampleInputs={version.runs[0].inputs} defaultFlavor={availableFlavors[0]} />
        )}
      </div>
    </>
  ) : (
    <EmptyPublishTab />
  )
}

function EmptyPublishTab() {
  return (
    <div className='flex flex-col items-center justify-center w-full p-8 m-8 bg-gray-100 rounded-lg'>
      <span className='font-medium text-gray-600'>Move your prompt to a Project before publishing it</span>
    </div>
  )
}
