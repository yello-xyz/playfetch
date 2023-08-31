import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion } from '@/types'
import { useState } from 'react'
import useContainerRect from '@/src/client/hooks/useContainerRect'
import RunCell from './runCell'
import { SingleTabHeader } from './tabSelector'

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
  const [containerRect, containerRef] = useContainerRect()

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

  const lastPartialRunID = runs.filter(run => !('inputs' in run)).slice(-1)[0]?.id
  const [previousLastRunID, setPreviousLastRunID] = useState(lastPartialRunID)
  if (lastPartialRunID !== previousLastRunID) {
    focusRun(lastPartialRunID)
    setPreviousLastRunID(lastPartialRunID)
  }

  return (
    <div ref={containerRef} className='relative flex flex-col h-full'>
      <SingleTabHeader label='Responses' />
      {runs.length > 0 ? (
        <div className='flex flex-col flex-1 gap-3 p-4 overflow-y-auto'>
          {runs.map(run => (
            <RunCell
              key={run.id}
              identifier={identifierForRunID(run.id)}
              run={run}
              version={version}
              activeItem={activeItem}
              containerRect={containerRect}
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
