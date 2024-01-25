import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  Chain,
  ChainVersion,
  IsPromptVersion,
  LogEntry,
  Prompt,
  PromptVersion,
  ResolvedEndpoint,
  Run,
} from '@/types'
import ProjectItemSelector from '../projects/projectItemSelector'
import VersionSelector from '../versions/versionSelector'
import RunTimeline from '../runs/runTimeline'
import PromptPanel from '../prompts/promptPanel'
import { IsEndpoint } from '@/src/common/activeItem'
import { ExtractInputKey } from '@/src/common/formatting'
import { useState } from 'react'

export default function ComparePane({
  project,
  comparableItems,
  logEntries,
  activeItem,
  activeVersion,
  setItemID,
  setVersionID,
  disabled,
  includeResponses,
}: {
  project: ActiveProject
  comparableItems: (Prompt | Chain | ResolvedEndpoint)[]
  logEntries: LogEntry[]
  activeItem?: ActivePrompt | ActiveChain | ResolvedEndpoint
  activeVersion?: PromptVersion | ChainVersion
  setItemID: (itemID: number) => void
  setVersionID: (versionID: number) => void
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

  const [pendingID, setPendingID] = useState<number>()
  const selectItemID = (itemID: number) => {
    setPendingID(itemID)
    setItemID(itemID)
  }

  return (
    <div className='flex flex-col w-1/2 h-full grow'>
      <div className='flex items-center gap-1 p-2.5 border-b border-gray-200 bg-white'>
        <ProjectItemSelector
          className='w-full max-w-[240px]'
          project={project}
          items={comparableItems}
          selectedItemID={activeItem?.id ?? pendingID}
          onSelectItemID={selectItemID}
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
        <div className='border-b border-gray-200 min-h-[226px] h-[226px] bg-gray-25'>
          <PromptPanel version={activeVersion} />
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
