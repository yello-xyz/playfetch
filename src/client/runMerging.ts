import { BuildFilter, Filter, FilterItem } from '@/components/filters'
import { IsProperRun, PartialRun, Run } from '@/types'

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
    contents: [...runs.map(run => run.output), ...properRuns.flatMap(run => Object.entries(run.inputs).flat())],
  }
}

export const BuildRunFilter = (filters: Filter[]) => (run: PartialRun | Run) =>
  !IsProperRun(run) || BuildFilter(filters)(FilterItemFromRun(run))

const groupGranularity = 5 * 60 * 1000
export const GroupRuns = (runs: (PartialRun | Run)[]): (PartialRun | Run)[][] =>
  runs.reduce(
    (groupedRuns, run) => {
      const previousTimestamp =
        groupedRuns.length > 0 ? groupedRuns.slice(-1)[0][0].timestamp ?? new Date().getTime() : undefined
      const nextTimestamp = run.timestamp ?? new Date().getTime()
      if (!previousTimestamp || nextTimestamp - previousTimestamp > groupGranularity) {
        return [...groupedRuns, [run]]
      } else {
        return [...groupedRuns.slice(0, -1), [...groupedRuns.slice(-1)[0], run]]
      }
    },
    [] as (PartialRun | Run)[][]
  )
