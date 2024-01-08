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
import { ExtractInputKey } from '@/src/common/formatting'

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
  const precedesContinuation = (continuation: LogEntry) => (log: LogEntry) =>
    !!continuation.continuationID &&
    log.continuationID === continuation.continuationID &&
    log.timestamp < continuation.timestamp
  const precedingRun = (log: LogEntry, logs: LogEntry[]) =>
    logs
      .filter(precedesContinuation(log))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-1)[0]
  const isContinuation = (log: LogEntry, logs: LogEntry[]) => !!precedingRun(log, logs)
  const extractInputKey = (log: LogEntry, logs: LogEntry[]) =>
    ExtractInputKey({ output: JSON.stringify(precedingRun(log, logs).output) })

  const endpointLogEntries = IsEndpoint(activeItem) ? logEntries.filter(log => log.endpointID === activeItem.id) : []
  const logsAsRuns: Run[] = endpointLogEntries.map((log, index, logs) => ({
    id: index,
    timestamp: log.timestamp,
    output: log.error ?? JSON.stringify(log.output, null, 2),
    inputs: isContinuation(log, logs)
      ? { [extractInputKey(log, logs)]: JSON.stringify(log.inputs, null, 2) }
      : log.inputs,
    cost: log.cost,
    duration: log.duration,
    failed: !!log.error,
    labels: [],
    continuationID: log.continuationID,
    index: 0,
    parentRunID: null,
    tokens: 0,
    userID: 0,
    rating: null,
    isPredictedRating: false,
    reason: null,
  }))

  return (
    <div className='flex flex-col w-1/2 h-full grow'>
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
        <div className='pb-4 border-b border-gray-200 min-h-[226px] h-[226px] bg-gray-25'>
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
