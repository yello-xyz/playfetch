import { ReactNode, useEffect, useState } from 'react'
import {
  ActiveProject,
  ActivePrompt,
  Endpoint,
  FindParentInProject,
  EndpointParentIsPrompt,
  EndpointParentsInProject,
  ResolvedEndpoint,
  LogEntry,
  ActiveChain,
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
import TabSelector, { SingleTabHeader } from './tabSelector'
import LogEntriesView from './logEntriesView'
import LogEntryDetailsPane from './logEntryDetailsPane'
import IconButton from './iconButton'
import collapseIcon from '@/public/collapse.svg'

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

export default function EndpointsView({
  project,
  logEntries = [],
  onRefresh,
}: {
  project: ActiveProject
  logEntries?: LogEntry[]
  onRefresh: () => Promise<void>
}) {
  type ActiveTab = 'Endpoints' | 'Logs'
  const [activeTab, setActiveTab] = useState<ActiveTab>('Endpoints')

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

  const tabSelector = (children?: ReactNode) => (
    <TabSelector
      tabs={logEntries.length > 0 ? ['Endpoints', 'Logs'] : ['Endpoints']}
      activeTab={activeTab}
      setActiveTab={selectTab}>
      {children}
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
      setActiveParent(undefined)
    }
  }

  const parent = activeParentID ? FindParentInProject(activeParentID, project) : undefined
  const [activeParent, setActiveParent] = useState<ActivePrompt | ActiveChain>()
  const [parentCache, setParentCache] = useState<Record<string, ActivePrompt | ActiveChain>>({})
  useEffect(() => {
    if (parent && parentCache[parent.id]) {
      setActiveParent(parentCache[parent.id])
    } else if (EndpointParentIsPrompt(parent)) {
      api.getPrompt(parent.id).then(({ prompt, versions, inputValues }) => {
        const activePrompt = toActivePrompt(prompt, versions, inputValues, project)
        setParentCache({ ...parentCache, [parent.id]: activePrompt })
        setActiveParent(activePrompt)
      })
    } else if (parent) {
      api.getChain(parent.id).then(activeChain => {
        setParentCache({ ...parentCache, [parent.id]: activeChain })
        setActiveParent(activeChain)
      })
    }
  }, [parent, project, parentCache])
  const activePrompt = EndpointParentIsPrompt(parent) ? (activeParent as ActivePrompt) : undefined

  const [versionIndex, setVersionIndex] = useState(-1)
  const version = activePrompt?.versions?.find(version => version.id === activeEndpoint?.versionID)
  const variables = parent
    ? EndpointParentIsPrompt(parent)
      ? ExtractPromptVariables(version?.prompt ?? '')
      : ExtractUnboundChainInputs(parent.items)
    : []

  const minWidth = 460
  const maxWidth = 680
  return (
    <Allotment>
      {activeTab === 'Endpoints' && !isEditing && (!activeEndpoint || IsSavedEndpoint(activeEndpoint)) && (
        <Allotment.Pane minSize={minWidth}>
          <EndpointsTable
            tabSelector={tabSelector}
            project={project}
            activeEndpoint={activeEndpoint}
            setActiveEndpoint={updateActiveEndpoint}
            onAddEndpoint={addEndpoint}
          />
        </Allotment.Pane>
      )}
      {activeTab === 'Endpoints' && activeEndpoint && (
        <Allotment.Pane minSize={minWidth} maxSize={maxWidth} preferredSize={minWidth}>
          <div className='flex flex-col w-full h-full bg-gray-25'>
            <SingleTabHeader
              label={activeEndpoint.id && parent ? parent.name : 'New Endpoint'}
              secondaryLabel={versionIndex >= 0 ? `Version ${versionIndex + 1}` : ''}>
              {!isEditing && <IconButton icon={collapseIcon} onClick={() => setActiveEndpointID(undefined)} />}
            </SingleTabHeader>
            <div className='flex flex-col gap-6 p-4 overflow-y-auto'>
              <EndpointSettingsPane
                endpoint={activeEndpoint}
                project={project}
                prompt={activePrompt}
                onSelectParentID={setActiveParentID}
                onSelectVersionIndex={setVersionIndex}
                isEditing={isEditing}
                setEditing={setEditing}
                onRefresh={refresh}
              />
              {IsSavedEndpoint(activeEndpoint) && activeEndpoint.enabled && !isEditing && activeParent && (
                <ExamplePane
                  endpoint={activeEndpoint}
                  variables={variables}
                  inputValues={activeParent.inputValues}
                  defaultFlavor={project.availableFlavors[0]}
                />
              )}
              {!isEditing && IsSavedEndpoint(activeEndpoint) && <UsagePane endpoint={activeEndpoint} />}
            </div>
          </div>
        </Allotment.Pane>
      )}
      {activeTab === 'Logs' && (
        <Allotment.Pane minSize={minWidth}>
          <div className='flex flex-col h-full min-h-0 text-gray-500 bg-gray-25'>
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
        <Allotment.Pane minSize={minWidth} maxSize={maxWidth} preferredSize={minWidth}>
          <LogEntryDetailsPane
            logEntry={logEntries[activeLogEntryIndex]}
            parent={parent}
            prompt={activePrompt}
            onCollapse={() => setActiveLogEntryIndex(undefined)}
          />
        </Allotment.Pane>
      )}
    </Allotment>
  )
}
