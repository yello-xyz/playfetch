import { ActivePrompt, PartialRun, Version } from '@/types'
import { useRef, useState } from 'react'
import useScrollDetection from './useScrollDetection'
import useContainerRect from './useContainerRect'
import RunCell from './runCell'
import TabSelector from './tabSelector'

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
  const [containerRect, containerRef] = useContainerRect()
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
    <div ref={containerRef} className='relative flex flex-col h-full'>
      <TabSelector tabs={['Responses']} />
      {runs.length > 0 ? (
        <div ref={scrollRef} className='flex flex-col flex-1 gap-3 p-4 overflow-y-auto'>
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
