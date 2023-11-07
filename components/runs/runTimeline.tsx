import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptInputs, PromptVersion, Run } from '@/types'
import { useState } from 'react'
import RunCell from './runCell'
import { SingleTabHeader } from '../tabSelector'

const sortByTimestamp = <T extends { timestamp: number }>(items: T[]): T[] =>
  items.sort((a, b) => a.timestamp - b.timestamp)

const hasTimestamp = <T extends { timestamp?: number }>(run: T): run is T & { timestamp: number } => !!run.timestamp

const sortRuns = <T extends { timestamp?: number }>(runs: T[]): T[] => [
  ...sortByTimestamp(runs.filter(hasTimestamp)),
  ...runs.filter(run => !hasTimestamp(run)),
]

export default function RunTimeline({
  runs = [],
  version,
  activeItem,
  activeRunID,
  runVersion,
  isRunning,
  skipHeader,
}: {
  runs: (PartialRun | Run)[]
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  activeRunID?: number
  runVersion?: (getVersion: () => Promise<number>, inputs: PromptInputs[], continuationID?: number) => Promise<any>
  isRunning?: boolean
  skipHeader?: boolean
}) {
  const identifierForRun = (runID: number) => `r${runID}`

  const focusRun = (focusRunID?: number) => {
    if (focusRunID !== undefined) {
      setTimeout(() => {
        const element = document.getElementById(identifierForRun(focusRunID))
        if (runs.length > 1 && element) {
          element.scrollIntoView({ behavior: 'auto', block: 'start' })
        }
      })
    }
  }

  const [previousActiveRunID, setPreviousActiveRunID] = useState(activeRunID)
  if (activeRunID !== previousActiveRunID) {
    focusRun(activeRunID)
    setPreviousActiveRunID(activeRunID)
  }

  const sortedRuns = sortRuns(runs).reduce(
    (sortedRuns, run) =>
      run.continuationID && run.continuationID === sortedRuns.slice(-1)[0]?.continuationID
        ? [
            ...sortedRuns.slice(0, -1),
            { ...sortedRuns.slice(-1)[0], continuations: [...(sortedRuns.slice(-1)[0].continuations ?? []), run] },
          ]
        : [...sortedRuns, run],

    [] as PartialRun[]
  )
  const lastPartialRunID = sortedRuns.filter(run => !('inputs' in run)).slice(-1)[0]?.id
  const [previousLastRunID, setPreviousLastRunID] = useState(lastPartialRunID)
  if (lastPartialRunID !== previousLastRunID) {
    focusRun(lastPartialRunID)
    setPreviousLastRunID(lastPartialRunID)
  }

  const runContinuation =
    version && runVersion
      ? async (continuationID: number, message: string, inputKey: string) =>
          runVersion(() => Promise.resolve(version.id), [{ [inputKey]: message }], continuationID)
      : undefined

  return (
    <div className='relative flex flex-col h-full'>
      {!skipHeader && (
        <div className='z-10 drop-shadow-[0_4px_14px_rgba(0,0,0,0.03)]'>
          <SingleTabHeader label='Responses' />
        </div>
      )}
      {runs.length > 0 ? (
        <div className='flex flex-col flex-1 gap-3 p-4 overflow-y-auto'>
          {sortedRuns.map(run => (
            <RunCell
              key={run.id}
              identifierForRun={identifierForRun}
              run={run}
              version={version}
              activeItem={activeItem}
              isRunning={isRunning}
              runContinuation={runContinuation}
            />
          ))}
        </div>
      ) : (
        <EmptyRuns isRunning={isRunning} />
      )}
    </div>
  )
}

function EmptyRuns({ isRunning }: { isRunning?: boolean }) {
  return isRunning ? (
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 m-4 bg-gray-100 rounded-lg'>
      <span className='font-medium text-gray-600'>Waiting for responses…</span>
    </div>
  ) : (
    <div className='flex flex-col gap-3 px-4 pt-4 overflow-y-hidden'>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className='min-h-[320px] bg-gray-50 rounded-lg'></div>
      ))}
    </div>
  )
}
