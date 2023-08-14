import { useEffect, useState } from 'react'
import {
  ActiveProject,
  ActivePrompt,
  Endpoint,
  FindParentInProject,
  EndpointParentIsPrompt,
  EndpointParentsInProject,
  ResolvedEndpoint,
} from '@/types'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import EndpointSettingsPane, { EndpointSettings } from './endpointSettingsPane'
import api from '@/src/client/api'
import EndpointsTable from './endpointsTable'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { toActivePrompt } from '@/pages/[projectID]'
import { ExtractUnboundChainInputs } from './chainNodeEditor'
import { Allotment } from 'allotment'

const NewEndpointConfig = {
  id: undefined,
  enabled: true,
  parentID: undefined,
  versionID: undefined,
  urlPath: '',
  flavor: undefined,
  useCache: true,
  useStreaming: false,
}

export default function EndpointsView({
  project,
  onRefresh,
}: {
  project: ActiveProject
  onRefresh: () => Promise<void>
}) {
  const endpoints = project.endpoints

  const [newEndpoint, setNewEndpoint] = useState<EndpointSettings>()
  const [isEditing, setEditing] = useState(false)

  const addEndpoint =
    EndpointParentsInProject(project).length > 0
      ? () => {
          setNewEndpoint(NewEndpointConfig)
          setActiveParentID(undefined)
          setEditing(true)
        }
      : undefined

  const refresh = async (newEndpointID?: number) => {
    await onRefresh()
    if (newEndpointID) {
      setActiveEndpointID(newEndpointID)
    }
  }

  if (newEndpoint && !isEditing) {
    setNewEndpoint(undefined)
  }

  const [activeEndpointID, setActiveEndpointID] = useState<number>()
  const activeEndpoint = newEndpoint ?? endpoints.find(endpoint => endpoint.id === activeEndpointID)
  const IsSavedEndpoint = (endpoint: EndpointSettings): endpoint is ResolvedEndpoint => !!endpoint?.id

  if (activeEndpointID && !activeEndpoint) {
    setActiveEndpointID(undefined)
  }

  const [activeParentID, setActiveParentID] = useState<number>()
  if (!isEditing && activeEndpoint && activeEndpoint.parentID !== activeParentID) {
    setActiveParentID(activeEndpoint.parentID)
  }

  const updateActiveEndpoint = (endpoint: Endpoint) => {
    setActiveEndpointID(endpoint.id)
    setActiveParentID(endpoint.parentID)
    if (endpoint.parentID !== activeParentID) {
      setActivePrompt(undefined)
    }
  }

  const parent = activeParentID ? FindParentInProject(activeParentID, project) : undefined
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>()
  const [promptCache, setPromptCache] = useState<Record<string, ActivePrompt>>({})
  useEffect(() => {
    if (EndpointParentIsPrompt(parent)) {
      if (promptCache[parent.id]) {
        setActivePrompt(promptCache[parent.id])
      } else {
        api.getPromptVersions(parent.id).then(versions => {
          const prompt = toActivePrompt(parent.id, versions, project)
          setPromptCache({ ...promptCache, [parent.id]: prompt })
          setActivePrompt(prompt)
        })
      }
    }
  }, [parent, project, promptCache])

  const version = activePrompt?.versions?.find(version => version.id === activeEndpoint?.versionID)
  const inputs = parent
    ? EndpointParentIsPrompt(parent)
      ? ExtractPromptVariables(version?.prompt ?? '')
      : ExtractUnboundChainInputs(parent.items)
    : []

  const minWidth = 460
  return (
    <Allotment>
      {!isEditing && (!activeEndpoint || IsSavedEndpoint(activeEndpoint)) && (
        <Allotment.Pane minSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-2 p-6 overflow-y-auto text-gray-500'>
            <EndpointsTable
              project={project}
              activeEndpoint={activeEndpoint}
              setActiveEndpoint={updateActiveEndpoint}
              onAddEndpoint={addEndpoint}
            />
          </div>
        </Allotment.Pane>
      )}
      {activeEndpoint && (
        <Allotment.Pane minSize={minWidth} preferredSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-6 p-6 overflow-y-auto max-w-[680px]'>
            <EndpointSettingsPane
              endpoint={activeEndpoint}
              project={project}
              prompt={activePrompt}
              onSelectParentID={setActiveParentID}
              isEditing={isEditing}
              setEditing={setEditing}
              onCollapse={isEditing ? undefined : () => setActiveEndpointID(undefined)}
              onRefresh={refresh}
            />
            {IsSavedEndpoint(activeEndpoint) && activeEndpoint.enabled && !isEditing && (
              <ExamplePane
                endpoint={activeEndpoint}
                inputs={inputs}
                inputValues={project.inputValues}
                defaultFlavor={project.availableFlavors[0]}
              />
            )}
            {!isEditing && IsSavedEndpoint(activeEndpoint) && <UsagePane endpoint={activeEndpoint} />}
          </div>
        </Allotment.Pane>
      )}
    </Allotment>
  )
}
