import { IsProperRun, PartialRun, Run } from '@/types'

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
  runs.reduce((runs, run) => {
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
  }, [] as (PartialRun | Run)[])
