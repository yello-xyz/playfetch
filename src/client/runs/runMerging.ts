import { IsProperRun, PartialRun, Run } from '@/types'
import HashValue from '@/src/common/hashing'
import { BuildFilter, Filter, FilterItem } from '@/src/client/filters/filters'

export const IdentifierForRun = (runID: number) => `r${runID}`

const lastContinuationTimestamp = <T extends { timestamp: number; continuationID?: number }>(run: T, runs: T[]) =>
  run.continuationID
    ? Math.max(...runs.filter(r => r.continuationID === run.continuationID).map(r => r.timestamp))
    : run.timestamp

const sortByTimestamp = <T extends { timestamp: number; continuationID?: number }>(items: T[]): T[] =>
  items.sort((a, b) =>
    a.continuationID === b.continuationID
      ? a.timestamp - b.timestamp
      : lastContinuationTimestamp(a, items) - lastContinuationTimestamp(b, items)
  )

const hasTimestamp = <T extends { timestamp?: number }>(run: T): run is T & { timestamp: number } => !!run.timestamp

export const SortRuns = <T extends { timestamp?: number }>(runs: T[]): T[] => [
  ...sortByTimestamp(runs.filter(hasTimestamp)),
  ...runs.filter(run => !hasTimestamp(run)),
]

export const MergeRuns = (runs: (PartialRun | Run)[]) =>
  runs.reduce(
    (runs, run) => {
      const previousRun = runs.slice(-1)[0]
      const compareRun = previousRun?.continuations ? previousRun.continuations.slice(-1)[0] : previousRun

      const wasPartialRun = compareRun && !IsProperRun(compareRun) && compareRun.index < run.index
      const isParentRun = compareRun && compareRun.parentRunID === run.id
      const sameParentRun = compareRun && !!run.parentRunID && run.parentRunID === compareRun.parentRunID
      const sameContinuation = compareRun && !!run.continuationID && run.continuationID === compareRun.continuationID

      return wasPartialRun || isParentRun || sameParentRun || sameContinuation
        ? [
            ...runs.slice(0, -1),
            {
              ...previousRun,
              id: (wasPartialRun && previousRun.id === compareRun.id) || isParentRun ? run.id : previousRun.id,
              continuations: [...(previousRun.continuations ?? []), run],
              continuationID: compareRun.continuationID ?? run.continuationID,
            },
          ]
        : [...runs, run]
    },
    [] as (PartialRun | Run)[]
  )

export const FilterItemFromRun = (run: Run): FilterItem => {
  const runs = [run, ...(run.continuations ?? [])]
  const properRuns = runs.filter(IsProperRun)
  return {
    userIDs: properRuns.map(run => run.userID),
    labels: properRuns.flatMap(run => run.labels),
    statuses: [],
    contents: [...runs.map(run => run.output), ...properRuns.flatMap(run => Object.entries(run.inputs).flat())],
  }
}

export const BuildRunFilter = (filters: Filter[]) => (run: PartialRun | Run) =>
  !IsProperRun(run) || BuildFilter(filters)(FilterItemFromRun(run))

export type RunSortOption = 'Date' | 'Test Data Row'

type Input = { [key: string]: string }
type Inputs = [Input[], number[]]
type InputMap = { [hash: number]: number }

const HashInput = (input: Input) =>
  HashValue(
    Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(kvp => kvp.join(':'))
      .join(':')
  )

export const BuildInputMap = (inputs: Inputs, sortOption: RunSortOption): InputMap | undefined => {
  if (sortOption === 'Test Data Row') {
    const inputMap = {} as InputMap
    inputs[0].forEach((input, index) => (inputMap[HashInput(input)] = inputs[1][index]))
    return inputMap
  } else {
    return undefined
  }
}

export const GetMappedRowForRun = (run: PartialRun | Run, inputMap: InputMap): number => {
  if (!IsProperRun(run)) {
    return Infinity
  }
  const row = inputMap[HashInput(run.inputs)]
  return row !== undefined ? row : -1
}

const sortByInput = (runs: (PartialRun | Run)[], inputMap: InputMap): (PartialRun | Run)[] =>
  runs.sort((a, b) => {
    const rowA = GetMappedRowForRun(a, inputMap)
    const rowB = GetMappedRowForRun(b, inputMap)
    return rowA !== rowB ? rowA - rowB : runs.indexOf(a) - runs.indexOf(b)
  })

const groupGranularity = 5 * 60 * 1000
export const GroupRuns = (runs: (PartialRun | Run)[], sortByInputMap: InputMap | undefined): (PartialRun | Run)[][] =>
  (sortByInputMap ? sortByInput(runs, sortByInputMap) : runs).reduce(
    (groupedRuns, run) => {
      const getValue = (run: PartialRun | Run) =>
        sortByInputMap ? GetMappedRowForRun(run, sortByInputMap) : run.timestamp ?? new Date().getTime()

      const previousValue = groupedRuns.length > 0 ? getValue(groupedRuns.slice(-1)[0][0]) : undefined
      const nextValue = getValue(run)

      const isNewGroup =
        previousValue === undefined ||
        (sortByInputMap ? nextValue !== previousValue : nextValue - previousValue > groupGranularity)

      return isNewGroup ? [...groupedRuns, [run]] : [...groupedRuns.slice(0, -1), [...groupedRuns.slice(-1)[0], run]]
    },
    [] as (PartialRun | Run)[][]
  )
