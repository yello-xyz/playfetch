import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion } from '@/types'
import { useState } from 'react'
import RunCell from './runCell'
import { SingleTabHeader } from './tabSelector'

const sortByTimestamp = <T extends { timestamp: string }>(items: T[]): T[] =>
  items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

const hasTimestamp = <T extends { timestamp?: string }>(run: T): run is T & { timestamp: string } => !!run.timestamp

const sortRuns = <T extends { timestamp?: string }>(runs: T[]): T[] => [
  ...sortByTimestamp(runs.filter(hasTimestamp)),
  ...runs.filter(run => !hasTimestamp(run)),
]

export default function RunTimeline({
  runs = [],
  version,
  activeItem,
  activeRunID,
  isRunning,
}: {
  runs: PartialRun[]
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  activeRunID?: number
  isRunning?: boolean
}) {
  const identifierForRunID = (runID: number) => `r${runID}`

  const focusRun = (focusRunID?: number) => {
    if (focusRunID !== undefined) {
      setTimeout(() => {
        const element = document.getElementById(identifierForRunID(focusRunID))
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

  const sortedRuns = sortRuns(runs)
  const lastPartialRunID = sortedRuns.filter(run => !('inputs' in run)).slice(-1)[0]?.id
  const [previousLastRunID, setPreviousLastRunID] = useState(lastPartialRunID)
  if (lastPartialRunID !== previousLastRunID) {
    focusRun(lastPartialRunID)
    setPreviousLastRunID(lastPartialRunID)
  }

  return (
    <div className='relative flex flex-col h-full'>
      <SingleTabHeader label='Responses' />
      {runs.length > 0 ? (
        <div className='flex flex-col flex-1 gap-3 p-4 overflow-y-auto'>
          {sortedRuns.map(run => (
            <RunCell
              key={run.id}
              identifier={identifierForRunID(run.id)}
              run={run}
              version={version}
              activeItem={activeItem}
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
