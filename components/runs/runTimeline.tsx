import {
  ActiveChain,
  ActivePrompt,
  ChainVersion,
  IsProperRun,
  PartialRun,
  PromptInputs,
  PromptVersion,
  Run,
} from '@/types'
import { useState } from 'react'
import RunCell from './runCell'
import { SingleTabHeader } from '../tabSelector'
import useInitialState from '@/src/client/hooks/useInitialState'
import { MergeRuns, SortRuns } from '@/src/client/runMerging'

const identifierForRun = (runID: number) => `r${runID}`

export default function RunTimeline({
  runs = [],
  version,
  activeItem,
  focusRunID,
  setFocusRunID,
  runVersion,
  selectInputValue = () => undefined,
  onRatingUpdate,
  isRunning,
  skipHeader,
}: {
  runs: (PartialRun | Run)[]
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  focusRunID?: number
  setFocusRunID?: (runID: number) => void
  runVersion?: (
    getVersion: () => Promise<number>,
    inputs: PromptInputs[],
    dynamicInputs: PromptInputs[],
    continuationID?: number
  ) => Promise<any>
  selectInputValue?: (inputKey: string) => string | undefined
  onRatingUpdate?: (run: Run) => Promise<void>
  isRunning?: boolean
  skipHeader?: boolean
}) {
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

  const [activeRunID, setActiveRunID] = useInitialState(focusRunID)
  const [previousActiveRunID, setPreviousActiveRunID] = useState<number>()
  if (activeRunID !== previousActiveRunID) {
    focusRun(activeRunID)
    setPreviousActiveRunID(activeRunID)
  }

  const mergedRuns = MergeRuns(SortRuns(runs))

  const lastPartialRunID = mergedRuns.filter(run => !('inputs' in run)).slice(-1)[0]?.id
  const [previousLastRunID, setPreviousLastRunID] = useState(lastPartialRunID)
  if (lastPartialRunID !== previousLastRunID) {
    focusRun(lastPartialRunID)
    setPreviousLastRunID(lastPartialRunID)
  }

  const isRunSelected = (run: PartialRun | Run) =>
    activeRunID === undefined ||
    !IsProperRun(run) ||
    run.id === activeRunID ||
    (run.continuations ?? []).some(run => run.id === activeRunID)
  const selectRun = (run: PartialRun | Run) =>
    mergedRuns.length > 1 && (setFocusRunID ? activeRunID !== run.id : activeRunID !== undefined)
      ? () => (setFocusRunID ? setFocusRunID(run.id) : setActiveRunID(undefined))
      : undefined

  return (
    <div className='relative flex flex-col h-full'>
      {!skipHeader && (
        <div className='z-5 drop-shadow-[0_4px_14px_rgba(0,0,0,0.03)]'>
          <SingleTabHeader label='Responses' />
        </div>
      )}
      {runs.length > 0 ? (
        <div className='flex flex-col flex-1 gap-3 p-3 overflow-y-auto'>
          {mergedRuns.map(run => (
            <RunCell
              key={run.id}
              identifierForRun={identifierForRun}
              run={run}
              version={version}
              activeItem={activeItem}
              isRunning={isRunning}
              isSelected={isRunSelected(run)}
              onSelect={selectRun(run)}
              runVersion={runVersion}
              selectInputValue={selectInputValue}
              onRatingUpdate={onRatingUpdate}
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
