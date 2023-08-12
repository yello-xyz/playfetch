import { useEffect, useState } from 'react'
import { ActiveProject, ActivePrompt, Chain, Endpoint, Prompt } from '@/types'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane from './publishSettingsPane'
import api from '@/src/client/api'
import EndpointsTable from './endpointsTable'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { toActivePrompt } from '@/pages/[projectID]'
import { ExtractUnboundChainInputs } from './chainNodeEditor'
import { Allotment } from 'allotment'
import 'allotment/dist/style.css'

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

  const isPrompt = (item: Chain | Prompt | undefined): item is Prompt => !!item && 'lastVersionID' in item

  const parent = [...project.chains, ...project.prompts].find(item => item.id === activeEndpoint?.parentID)
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>()
  useEffect(() => {
    if (isPrompt(parent)) {
      api.getPromptVersions(parent.id).then(versions => setActivePrompt(toActivePrompt(parent.id, versions, project)))
    }
  }, [parent, project])

  const version = activePrompt?.versions?.find(version => version.id === activeEndpoint?.versionID)
  const inputs = parent
    ? isPrompt(parent)
      ? ExtractPromptVariables(version?.prompt ?? '')
      : ExtractUnboundChainInputs(parent.items)
    : []

  const minWidth = 460
  return (
    <Allotment>
      <Allotment.Pane minSize={minWidth}>
        <div className='flex flex-col items-start h-full gap-2 p-6 overflow-y-auto text-gray-500'>
          <EndpointsTable
            project={project}
            activeEndpoint={activeEndpoint}
            setActiveEndpoint={updateActiveEndpoint}
            onRefresh={onRefresh}
          />
        </div>
      </Allotment.Pane>
      {activeEndpoint && parent && (
        <Allotment.Pane minSize={minWidth} preferredSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
            <PublishSettingsPane
              endpoint={activeEndpoint}
              project={project}
              prompt={activePrompt}
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
        </Allotment.Pane>
      )}
    </Allotment>
  )
}
