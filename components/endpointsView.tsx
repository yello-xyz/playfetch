import { useEffect, useState } from 'react'
import {
  ActiveProject,
  ActivePrompt,
  Endpoint,
  FindParentInProject,
  EndpointParentIsPrompt,
  EndpointParentsInProject,
  ResolvedEndpoint,
  LogEntry,
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
import TabSelector, { TabButton } from './tabSelector'
import LogEntriesView from './logEntriesView'
import LogEntryDetailsPane from './logEntryDetailsPane'

const NewEndpointSettings: EndpointSettings = {
  id: undefined,
  enabled: true,
  parentID: undefined,
  versionID: undefined,
  urlPath: '',
  flavor: undefined,
  useCache: true,
  useStreaming: false,
}

type ActiveTab = 'endpoints' | 'logs'

export default function EndpointsView({
  project,
  logEntries = [],
  onRefresh,
}: {
  project: ActiveProject
  logEntries?: LogEntry[]
  onRefresh: () => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('endpoints')

  const [activeLogEntryIndex, setActiveLogEntryIndex] = useState<number>()
  const updateActiveLogEntryIndex = (index: number) => {
    setActiveLogEntryIndex(index)
    const endpoint = project.endpoints.find(endpoint => endpoint.id === logEntries[index].endpointID)
    updateActiveEndpoint(endpoint!)
  }

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    setActiveLogEntryIndex(undefined)
  }

  const tabSelector = (
    <TabSelector>
      <TabButton title='Endpoints' tab='endpoints' activeTab={activeTab} setActiveTab={selectTab} />
      {logEntries.length > 0 && <TabButton title='Logs' tab='logs' activeTab={activeTab} setActiveTab={selectTab} />}
    </TabSelector>
  )

  const endpoints = project.endpoints

  const [newEndpoint, setNewEndpoint] = useState<EndpointSettings>()
  const [isEditing, setEditing] = useState(false)

  const addEndpoint =
    EndpointParentsInProject(project).length > 0
      ? () => {
          setNewEndpoint(NewEndpointSettings)
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
        api.getPrompt(parent.id).then(({ prompt, versions, inputValues }) => {
          const activePrompt = toActivePrompt(prompt, versions, inputValues, project)
          setPromptCache({ ...promptCache, [parent.id]: activePrompt })
          setActivePrompt(activePrompt)
        })
      }
    }
  }, [parent, project, promptCache])

  const version = activePrompt?.versions?.find(version => version.id === activeEndpoint?.versionID)
  const variables = parent
    ? EndpointParentIsPrompt(parent)
      ? ExtractPromptVariables(version?.prompt ?? '')
      : ExtractUnboundChainInputs(parent.items)
    : []

  const minWidth = 460
  return (
    <Allotment>
      {activeTab === 'endpoints' && !isEditing && (!activeEndpoint || IsSavedEndpoint(activeEndpoint)) && (
        <Allotment.Pane minSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-2 p-4 pt-3 overflow-y-auto text-gray-500'>
            <EndpointsTable
              tabSelector={tabSelector}
              project={project}
              activeEndpoint={activeEndpoint}
              setActiveEndpoint={updateActiveEndpoint}
              onAddEndpoint={addEndpoint}
            />
          </div>
        </Allotment.Pane>
      )}
      {activeTab === 'endpoints' && activeEndpoint && (
        <Allotment.Pane minSize={minWidth} preferredSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-6 p-4 overflow-y-auto max-w-[680px]'>
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
                variables={variables}
                inputValues={project.inputValues}
                defaultFlavor={project.availableFlavors[0]}
              />
            )}
            {!isEditing && IsSavedEndpoint(activeEndpoint) && <UsagePane endpoint={activeEndpoint} />}
          </div>
        </Allotment.Pane>
      )}
      {activeTab === 'logs' && (
        <Allotment.Pane minSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-2 p-4 overflow-y-auto text-gray-500'>
            <LogEntriesView
              tabSelector={tabSelector}
              logEntries={logEntries}
              endpoints={project.endpoints}
              activeIndex={activeLogEntryIndex}
              setActiveIndex={updateActiveLogEntryIndex}
            />
          </div>
        </Allotment.Pane>
      )}
      {activeLogEntryIndex !== undefined && activeEndpoint && IsSavedEndpoint(activeEndpoint) && parent && (
        <Allotment.Pane minSize={minWidth}>
          <div className='flex flex-col items-start h-full gap-6 p-4 overflow-y-auto'>
            <LogEntryDetailsPane
              logEntry={logEntries[activeLogEntryIndex]}
              endpoint={activeEndpoint}
              parent={parent}
              prompt={activePrompt}
              onCollapse={() => setActiveLogEntryIndex(undefined)}
            />
          </div>
        </Allotment.Pane>
      )}
    </Allotment>
  )
}
