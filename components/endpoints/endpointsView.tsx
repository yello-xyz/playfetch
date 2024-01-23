import { ReactNode, useEffect, useState } from 'react'
import {
  ActivePrompt,
  Endpoint,
  FindItemInProject,
  ProjectItemIsChain,
  ItemsInProject,
  ResolvedEndpoint,
  ActiveChain,
  PromptVersion,
  ChainVersion,
  Analytics,
  LogEntry,
} from '@/types'
import UsagePane from './usagePane'
import ExamplePane from './examplePane'
import EndpointSettingsPane, { EndpointSettings } from './endpointSettingsPane'
import EndpointsTable from './endpointsTable'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { Allotment } from 'allotment'
import TabsHeader, { SingleTabHeader } from '../tabsHeader'
import LogEntriesView from './logEntriesView'
import LogEntryDetailsPane from './logEntryDetailsPane'
import IconButton from '../iconButton'
import collapseIcon from '@/public/collapse.svg'
import { EndpointsRoute, LogsRoute, ParseNumberQuery } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'
import useActiveItemCache from '@/src/client/hooks/useActiveItemCache'
import { useActiveProject, useRefreshProject } from '@/src/client/context/projectContext'
import { HeaderItem } from '../headerItem'
import { ExtractUnboundChainInputs } from '../chains/chainItems'

const NewEndpointSettings = (parentID?: number, versionID?: number): EndpointSettings => ({
  id: undefined,
  enabled: true,
  parentID,
  versionID,
  urlPath: '',
  flavor: undefined,
  useCache: true,
  useStreaming: false,
})

export default function EndpointsView({
  analytics,
  refreshAnalytics,
}: {
  analytics?: Analytics
  refreshAnalytics: (dayRange: number) => void
}) {
  const router = useRouter()
  const { l: showLogs, p: newParentID, v: newVersionID } = ParseNumberQuery(router.query)

  type ActiveTab = 'Endpoints' | 'Logs'
  const tabFromQuery = (showLogs: number | undefined) => (showLogs ? 'Logs' : 'Endpoints')
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabFromQuery(showLogs))

  if (tabFromQuery(showLogs) !== activeTab) {
    setActiveTab(tabFromQuery(showLogs))
  }

  const logEntries = analytics?.recentLogEntries ?? []
  const [activeLogEntryIndex, setActiveLogEntryIndex] = useState<number>()

  const activeProject = useActiveProject()
  const endpoints = activeProject.endpoints

  const updateActiveLogEntryIndex = (index: number) => {
    setActiveLogEntryIndex(index)
    const endpoint = endpoints.find(endpoint => endpoint.id === logEntries[index].endpointID)
    setActiveEndpointID(endpoint?.id)
    setActiveParentID(logEntries[index].parentID)
  }

  const selectTab = (tab: ActiveTab) => {
    router.push(tab === 'Logs' ? LogsRoute(activeProject.id) : EndpointsRoute(activeProject.id), undefined, {
      shallow: true,
    })
    setActiveTab(tab)
    setActiveLogEntryIndex(undefined)
  }

  const tabSelector = (children?: ReactNode) => (
    <TabsHeader
      tabs={
        logEntries.some(entry => endpoints.some(e => e.id === entry.endpointID)) ? ['Endpoints', 'Logs'] : ['Endpoints']
      }
      activeTab={activeTab}
      setActiveTab={selectTab}>
      {children}
    </TabsHeader>
  )

  const startsEditing = newParentID !== undefined && newVersionID !== undefined
  const [isEditing, setEditing] = useState(startsEditing)
  const [newEndpoint, setNewEndpoint] = useState(
    startsEditing ? NewEndpointSettings(newParentID, newVersionID) : undefined
  )

  const addEndpoint =
    ItemsInProject(activeProject).length > 0
      ? () => {
          setNewEndpoint(NewEndpointSettings())
          setActiveParentID(undefined)
          setActiveParent(undefined)
          setEditing(true)
        }
      : undefined

  const refreshProject = useRefreshProject()

  const refresh = async (newEndpointID?: number) => {
    await refreshProject()
    if (newEndpointID) {
      setActiveEndpointID(newEndpointID)
    }
  }

  if (newEndpoint && !isEditing) {
    setNewEndpoint(undefined)
    router.push(EndpointsRoute(activeProject.id), undefined, { shallow: true })
  }

  const [activeEndpointID, setActiveEndpointID] = useState<number>()
  const activeEndpoint = newEndpoint ?? endpoints.find(endpoint => endpoint.id === activeEndpointID)
  const IsSavedEndpoint = (endpoint: EndpointSettings): endpoint is ResolvedEndpoint => !!endpoint?.id

  if (activeEndpointID && !activeEndpoint) {
    setActiveEndpointID(undefined)
  }

  const [activeParentID, setActiveParentID] = useState(newParentID)
  if (!isEditing && activeLogEntryIndex === undefined && activeEndpoint && activeEndpoint.parentID !== activeParentID) {
    setActiveParentID(activeEndpoint.parentID)
  }

  const updateActiveEndpoint = (endpoint: Endpoint) => {
    setActiveEndpointID(endpoint.id)
    setActiveParentID(endpoint.parentID)
    setActiveLogEntryIndex(undefined)
    if (endpoint.parentID !== activeParentID) {
      setActiveParent(undefined)
    }
  }

  const parent = activeParentID ? FindItemInProject(activeParentID, activeProject) : undefined
  const [activeParent, setActiveParent] = useState<ActivePrompt | ActiveChain>()
  const parentCache = useActiveItemCache(activeProject, parent ? [parent.id] : [], setActiveParent)
  useEffect(() => setActiveParent(parent ? parentCache.itemForID(parent.id) : undefined), [parent, parentCache])

  const [versionIndex, setVersionIndex] = useState(-1)
  const versions = activeParent?.versions ?? []
  const activeVersion = (versions as (PromptVersion | ChainVersion)[]).find(
    version => version.id === activeEndpoint?.versionID
  )
  const variables = parent
    ? ProjectItemIsChain(parent)
      ? activeVersion?.items
        ? ExtractUnboundChainInputs(activeVersion.items, false)
        : []
      : activeVersion?.prompts && activeVersion?.config
        ? ExtractPromptVariables(activeVersion.prompts, activeVersion.config, false)
        : []
    : []

  const minWidth = 460
  const maxWidth = 680
  const isEditingClass = isEditing ? 'pl-2' : ''

  return (
    <Allotment>
      {activeTab === 'Endpoints' && !isEditing && (!activeEndpoint || IsSavedEndpoint(activeEndpoint)) && (
        <Allotment.Pane minSize={minWidth}>
          <EndpointsTable
            tabSelector={tabSelector}
            activeEndpoint={activeEndpoint}
            setActiveEndpoint={updateActiveEndpoint}
            onAddEndpoint={addEndpoint}
            analytics={analytics}
            refreshAnalytics={refreshAnalytics}
          />
        </Allotment.Pane>
      )}
      {activeTab === 'Endpoints' && activeEndpoint && (
        <Allotment.Pane
          key={isEditing.toString()}
          minSize={isEditing ? undefined : minWidth}
          maxSize={isEditing ? undefined : maxWidth}
          preferredSize={isEditing ? '100%' : minWidth}>
          <div className={`${isEditingClass} flex flex-col w-full h-full bg-gray-25 `}>
            <SettingsPaneHeader
              isEditing={isEditing}
              label={activeEndpoint.id && parent ? parent.name : 'New Endpoint'}
              secondaryLabel={versionIndex >= 0 ? `Version ${versionIndex + 1}` : undefined}
              onNavigateBack={() => setEditing(false)}
              onCollapse={() => setActiveEndpointID(undefined)}
            />
            <div className='flex flex-col gap-4 py-4 px-2 overflow-y-auto max-w-[680px]'>
              <EndpointSettingsPane
                endpoint={activeEndpoint}
                activeParent={activeParent}
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
                  defaultFlavor={activeProject.availableFlavors[0]}
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
              endpoints={endpoints}
              activeIndex={activeLogEntryIndex}
              setActiveIndex={updateActiveLogEntryIndex}
            />
          </div>
        </Allotment.Pane>
      )}
      {activeLogEntryIndex !== undefined && (
        <Allotment.Pane minSize={minWidth} maxSize={maxWidth} preferredSize={minWidth}>
          <LogEntryDetailsPane
            logEntries={sameContinuationEntries(logEntries[activeLogEntryIndex], logEntries)}
            parent={parent}
            versions={versions}
            onCollapse={() => setActiveLogEntryIndex(undefined)}
          />
        </Allotment.Pane>
      )}
    </Allotment>
  )
}

const sameContinuationEntries = (entry: LogEntry, entries: LogEntry[]) =>
  entry.continuationID ? entries.filter(logEntry => logEntry.continuationID === entry.continuationID) : [entry]

function SettingsPaneHeader({
  label,
  secondaryLabel,
  isEditing,
  onNavigateBack,
  onCollapse,
}: {
  label: string
  secondaryLabel?: string
  isEditing: boolean
  onNavigateBack: () => void
  onCollapse: () => void
}) {
  const labelSuffix = secondaryLabel ? ` (${secondaryLabel})` : ''
  return isEditing ? (
    <div className='flex mt-1 -mb-2 -ml-1'>
      <HeaderItem active={false} className='cursor-pointer' onClick={onNavigateBack}>
        <Icon className='rotate-90 -mr-0.5' icon={chevronIcon} />
        Endpoints /
      </HeaderItem>
      <HeaderItem className='-mx-2.5'>{`${label}${labelSuffix}`}</HeaderItem>
    </div>
  ) : (
    <SingleTabHeader label={label} secondaryLabel={secondaryLabel}>
      <IconButton icon={collapseIcon} onClick={onCollapse} />
    </SingleTabHeader>
  )
}
