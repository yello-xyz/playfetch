import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  ChainVersion,
  IsPromptVersion,
  LogEntry,
  PromptVersion,
  ResolvedEndpoint,
  Run,
} from '@/types'
import ProjectItemSelector from '../projects/projectItemSelector'
import VersionSelector from '../versions/versionSelector'
import RunTimeline from '../runs/runTimeline'
import PromptPanel, { PromptTab } from '../prompts/promptPanel'
import { IsEndpoint } from '@/src/common/activeItem'

export default function ComparePane({
  project,
  logEntries,
  activeItem,
  activeVersion,
  setItemID,
  setVersionID,
  activePromptTab,
  setActivePromptTab,
  disabled,
  includeResponses,
}: {
  project: ActiveProject
  logEntries: LogEntry[]
  activeItem?: ActivePrompt | ActiveChain | ResolvedEndpoint
  activeVersion?: PromptVersion | ChainVersion
  setItemID: (itemID: number) => void
  setVersionID: (versionID: number) => void
  activePromptTab?: PromptTab
  setActivePromptTab: (tab: PromptTab) => void
  disabled?: boolean
  includeResponses?: boolean
}) {
  const endpointLogEntries = IsEndpoint(activeItem) ? logEntries.filter(log => log.endpointID === activeItem.id) : []
  const logsAsRuns: Run[] = endpointLogEntries.map((log, index) => ({
    id: index,
    timestamp: log.timestamp,
    output: log.error ?? JSON.stringify(log.output, null, 2),
    inputs: log.inputs,
    cost: log.cost,
    duration: log.duration,
    failed: !!log.error,
    labels: [],
  }))

  return (
    <div className='flex flex-col flex-grow w-1/2 h-full'>
      <div className='flex items-center gap-1 p-4 border-b border-gray-200'>
        <ProjectItemSelector
          className='w-full max-w-[240px]'
          project={project}
          selectedItemID={activeItem?.id}
          onSelectItemID={setItemID}
          includeEndpoints
          disabled={disabled}
        />
        {!IsEndpoint(activeItem) && (
          <VersionSelector
            className='w-full max-w-[240px]'
            projectItem={activeItem}
            selectedVersionID={activeVersion?.id}
            onSelectVersionID={setVersionID}
            disabled={disabled}
          />
        )}
      </div>
      {activeVersion && IsPromptVersion(activeVersion) && (
        <div className='p-4 border-b border-gray-200 min-h-[188px]'>
          <PromptPanel
            version={activeVersion}
            initialActiveTab={activePromptTab}
            onActiveTabChange={setActivePromptTab}
          />
        </div>
      )}
      {includeResponses && (activeVersion || IsEndpoint(activeItem)) && (
        <div className='overflow-y-auto'>
          {activeVersion && !IsEndpoint(activeItem) ? (
            <RunTimeline runs={activeVersion!.runs} activeItem={activeItem} version={activeVersion} skipHeader />
          ) : (
            <RunTimeline runs={logsAsRuns} skipHeader />
          )}
        </div>
      )}
    </div>
  )
}
