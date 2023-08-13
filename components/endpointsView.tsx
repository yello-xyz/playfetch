import { useEffect, useState } from 'react'
import {
  ActiveProject,
  ActivePrompt,
  Endpoint,
  FindParentInProject,
  EndpointParentIsPrompt,
  EndpointParentsInProject,
  Prompt,
  Chain,
  ResolvedEndpoint,
} from '@/types'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import PublishSettingsPane, { EditableEndpoint } from './publishSettingsPane'
import api from '@/src/client/api'
import EndpointsTable from './endpointsTable'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import { toActivePrompt } from '@/pages/[projectID]'
import { ExtractUnboundChainInputs } from './chainNodeEditor'
import { Allotment } from 'allotment'

const NewConfigFromEndpoints = (endpoints: Endpoint[], parent: Prompt | Chain, availableFlavors: string[]) => {
  const existingNamesForParent = endpoints
    .filter(endpoint => endpoint.parentID === parent.id)
    .map(endpoint => endpoint.urlPath)
  for (const existingName of existingNamesForParent) {
    const otherEndpointsWithName = endpoints.filter(endpoint => endpoint.urlPath === existingName)
    const existingFlavors = otherEndpointsWithName.map(endpoint => endpoint.flavor)
    const availableFlavor = availableFlavors.find(flavor => !existingFlavors.includes(flavor))
    if (availableFlavor) {
      return { name: existingName, flavor: availableFlavor }
    }
  }
  return {
    name: ToCamelCase(parent.name.split(' ').slice(0, 3).join(' ')),
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

  const [newEndpoint, setNewEndpoint] = useState<EditableEndpoint>()

  const parents = EndpointParentsInProject(project)
  const addEndpoint =
    parents.length > 0
      ? () => {
          const parent = parents[0]
          const { name, flavor } = NewConfigFromEndpoints(project.endpoints, parent, project.availableFlavors)
          const versionID = EndpointParentIsPrompt(parent) ? parent.lastVersionID : undefined
          api.publishEndpoint(project.id, parent.id, versionID, name, flavor, false, false).then(onRefresh)
        }
      : undefined

  const [activeEndpointID, setActiveEndpointID] = useState<number>()
  const activeEndpoint = newEndpoint ?? endpoints.find(endpoint => endpoint.id === activeEndpointID)
  const IsSavedEndpoint = (endpoint: EditableEndpoint): endpoint is ResolvedEndpoint => !!endpoint?.id

  if (activeEndpointID && !activeEndpoint) {
    setActiveEndpointID(undefined)
  }

  const updateActiveEndpoint = (endpoint: Endpoint) => {
    setActiveEndpointID(endpoint.id)
    if (endpoint.parentID !== activeEndpoint?.parentID) {
      setActivePrompt(undefined)
    }
  }

  const parent = activeEndpoint ? FindParentInProject(activeEndpoint.parentID, project) : undefined
  const [activePrompt, setActivePrompt] = useState<ActivePrompt>()
  useEffect(() => {
    if (EndpointParentIsPrompt(parent)) {
      api.getPromptVersions(parent.id).then(versions => setActivePrompt(toActivePrompt(parent.id, versions, project)))
    }
  }, [parent, project])

  const version = activePrompt?.versions?.find(version => version.id === activeEndpoint?.versionID)
  const inputs = parent
    ? EndpointParentIsPrompt(parent)
      ? ExtractPromptVariables(version?.prompt ?? '')
      : ExtractUnboundChainInputs(parent.items)
    : []

  const [isEditing, setEditing] = useState(false)

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
      {activeEndpoint && parent && (
        <Allotment.Pane minSize={minWidth} preferredSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-6 p-6 overflow-y-auto max-w-[680px]'>
            <PublishSettingsPane
              endpoint={activeEndpoint}
              project={project}
              prompt={activePrompt}
              isEditing={isEditing}
              setEditing={setEditing}
              onCollapse={isEditing ? undefined : () => setActiveEndpointID(undefined)}
              onRefresh={onRefresh}
            />
            {IsSavedEndpoint(activeEndpoint) && activeEndpoint.enabled && !isEditing && (
              <ExamplePane
                endpoint={activeEndpoint}
                inputs={inputs}
                inputValues={project.inputValues}
                defaultFlavor={project.availableFlavors[0]}
              />
            )}
            {!isEditing && IsSavedEndpoint(activeEndpoint) && (
              <UsagePane endpoint={activeEndpoint} onRefresh={onRefresh} />
            )}
          </div>
        </Allotment.Pane>
      )}
    </Allotment>
  )
}
