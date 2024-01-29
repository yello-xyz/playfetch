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
import { SingleTabHeader } from '../tabsHeader'
import useInitialState from '@/src/client/hooks/useInitialState'
import {
  BuildRunFilter,
  GroupRuns,
  IdentifierForRun,
  MergeRuns,
  SortRuns,
  BuildInputMap,
  RunSortOption,
} from '@/src/client/runMerging'
import { RunGroup } from './runGroup'
import { Filter } from '../filters/filters'
import RunFiltersHeader from './runFiltersHeader'

export default function RunTimeline({
  runs = [],
  version,
  activeItem,
  focusRunID,
  setFocusRunID,
  runVersion,
  inputs = [[], []],
  selectInputValue = () => undefined,
  onRatingUpdate,
  isRunning,
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
  inputs?: [{ [key: string]: string }[], number[]]
  selectInputValue?: (inputKey: string) => string | undefined
  onRatingUpdate?: (run: Run) => Promise<void>
  isRunning?: boolean
}) {
  const focusRun = (focusRunID?: number) => {
    if (focusRunID !== undefined) {
      setTimeout(() => {
        const element = document.getElementById(IdentifierForRun(focusRunID))
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

  const [activeSortOption, setActiveSortOption] = useState<RunSortOption>('Date')
  const [filters, setFilters] = useState<Filter[]>([])

  const inputMap = BuildInputMap(inputs, activeSortOption)
  const mergedRuns = MergeRuns(SortRuns(runs)).filter(BuildRunFilter(filters))

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
      {activeItem && (
        <RunFiltersHeader
          activeItem={activeItem}
          runs={mergedRuns}
          filters={filters}
          setFilters={setFilters}
          activeSortOption={activeSortOption}
          setActiveSortOption={setActiveSortOption}
          tabSelector={children => <SingleTabHeader label='Responses'>{children}</SingleTabHeader>}
        />
      )}
      {runs.length > 0 ? (
        <div className='flex flex-col flex-1 gap-3 p-3 overflow-y-auto'>
          {GroupRuns(mergedRuns, inputMap).map((group, index) => (
            <RunGroup
              key={index}
              group={group}
              sortByInputMap={inputMap}
              version={version}
              activeItem={activeItem}
              isRunSelected={isRunSelected}
              selectRun={selectRun}
              runVersion={runVersion}
              selectInputValue={selectInputValue}
              onRatingUpdate={onRatingUpdate}
              isRunning={isRunning}
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
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 m-4 rounded-lg bg-gray-50'>
      <span className='font-medium text-gray-600'>Waiting for responses…</span>
    </div>
  ) : (
    <div className='flex flex-col gap-3 px-3 pt-3 overflow-y-hidden'>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className='min-h-[320px] bg-gray-50 rounded-lg'></div>
      ))}
    </div>
  )
}
