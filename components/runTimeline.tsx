import { ActivePrompt, PartialRun, Version } from '@/types'
import { useRef, useState } from 'react'
import useScrollDetection from './useScrollDetection'
import useContainerRect from './useContainerRect'
import RunCell from './runCell'

export default function RunTimeline({
  runs = [],
  version,
  prompt,
  activeRunID,
  isRunning,
}: {
  runs: PartialRun[]
  version?: Version
  prompt?: ActivePrompt
  activeRunID?: number
  isRunning?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerRect = useContainerRect(containerRef)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  useScrollDetection(setScrollTop, scrollRef)

  const identifierForRunID = (runID: number) => `r${runID}`

  const focusRun = (focusRunID?: number) => {
    if (focusRunID !== undefined) {
      setTimeout(() => {
        const element = document.getElementById(identifierForRunID(focusRunID))
        if (runs.length > 1 && element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
    <div ref={containerRef} className='relative flex flex-col h-full gap-4'>
      <div className='font-medium text-gray-600'>Responses</div>
      {runs.length > 0 ? (
        <div ref={scrollRef} className='flex flex-col flex-1 gap-2 overflow-y-auto'>
          {runs.map((run, index) => (
            <RunCell
              key={run.id}
              identifier={identifierForRunID(run.id)}
              run={run}
              version={version}
              prompt={prompt}
              containerRect={containerRect}
              scrollTop={scrollTop}
              isLast={index === runs.length - 1}
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
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
      <span className='font-medium text-gray-600'>Waiting for responses…</span>
    </div>
  ) : (
    <div className='flex flex-col gap-4 overflow-y-hidden'>
      {Array.from({ length: 3 }).map(_ => (
        <div className='min-h-[320px] bg-gray-25 rounded-lg'></div>
      ))}
    </div>
  )
}
