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
import { SingleTabHeader } from '../tabSelector'
import useInitialState from '@/src/client/hooks/useInitialState'
import {
  BuildRunFilter,
  GroupRuns,
  IdentifierForRun,
  MergeRuns,
  FilterItemFromRun,
  SortRuns,
  BuildInputMap,
} from '@/src/client/runMerging'
import { RunGroup } from './runGroup'
import Filters, { Filter } from '../filters'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'

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
  inputs?: [{ [key: string]: string }[], number[]]
  selectInputValue?: (inputKey: string) => string | undefined
  onRatingUpdate?: (run: Run) => Promise<void>
  isRunning?: boolean
  skipHeader?: boolean
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

  type SortOption = 'Date' | 'Test Data Row'
  const sortOptions: SortOption[] = ['Date', 'Test Data Row']
  const [activeSortOption, setActiveSortOption] = useState(sortOptions[0])
  const [filters, setFilters] = useState<Filter[]>([])
  const labelColors = activeItem ? AvailableLabelColorsForItem(activeItem) : {}

  const sortByInputMap = activeSortOption === 'Test Data Row' ? BuildInputMap(inputs) : undefined
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
      {!skipHeader && activeItem && (
        <Filters
          users={activeItem.users}
          labelColors={labelColors}
          items={mergedRuns.filter(IsProperRun).map(FilterItemFromRun)}
          filters={filters}
          setFilters={setFilters}
          sortOptions={sortOptions}
          activeSortOption={activeSortOption}
          setActiveSortOption={setActiveSortOption}
          tabSelector={children => <SingleTabHeader label='Responses'>{children}</SingleTabHeader>}
        />
      )}
      {runs.length > 0 ? (
        <div className='flex flex-col flex-1 gap-3 p-3 overflow-y-auto'>
          {GroupRuns(mergedRuns, sortByInputMap).map((group, index) => (
            <RunGroup
              key={index}
              group={group}
              sortByInputMap={sortByInputMap}
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
