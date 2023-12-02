import api, { StreamReader } from '@/src/client/api'
import { useState } from 'react'
import { PartialRun, PromptInputs } from '@/types'
import { useRefreshActiveItem } from '../context/projectContext'

export const ConsumeStream = async (
  inputs: PromptInputs[],
  streamReader: StreamReader,
  callback: (runs: PartialRun[]) => void
) => {
  const runs = Object.fromEntries(inputs.map((_, inputIndex) => [inputIndex, {} as { [index: number]: PartialRun }]))
  while (streamReader) {
    const { done, value } = await streamReader.read()
    if (done) {
      break
    }
    const text = await new Response(value).text()
    const lines = text.split('\n')
    for (const line of lines.filter(line => line.trim().length > 0)) {
      const data = line.split('data:').slice(-1)[0]
      const { inputIndex, index, message, cost, duration, failed, continuationID } = JSON.parse(data)
      const previousOutput = runs[inputIndex][index]?.output ?? ''
      const output = message ? `${previousOutput}${message}` : previousOutput
      runs[inputIndex][index] = { id: index, index, output, cost, duration, failed, continuationID }
    }
    const maxSteps = Math.max(...Object.values(runs).map(runs => Object.keys(runs).length))
    const sortedRuns = Object.entries(runs)
      .flatMap(([inputIndex, inputRuns]) =>
        Object.entries(inputRuns).map(([index, run]) => ({
          ...run,
          id: Number(inputIndex) * maxSteps + Number(index),
        }))
      )
      .sort((a, b) => a.id - b.id)
    callback(sortedRuns)
  }
}

export default function useRunVersion(activeVersionID: number) {
  const refreshActiveItem = useRefreshActiveItem()
  const [isRunning, setRunning] = useState(false)
  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [highestRunIndex, setHighestRunIndex] = useState(-1)

  const [runningVersionID, setRunningVersionID] = useState(activeVersionID)
  const [lastActiveVersionID, setLastActiveVersionID] = useState(activeVersionID)
  if (activeVersionID !== lastActiveVersionID && activeVersionID !== runningVersionID) {
    setLastActiveVersionID(activeVersionID)
    setRunning(false)
    setPartialRuns([])
    setHighestRunIndex(-1)
  }

  const runVersion = async (getVersion: () => Promise<number>, inputs: PromptInputs[], continuationID?: number) => {
    setRunning(true)
    setPartialRuns([])
    setHighestRunIndex(-1)
    const versionID = await getVersion()
    setRunningVersionID(versionID)
    const streamReader = await api.runVersion(versionID, inputs, continuationID)
    await ConsumeStream(inputs, streamReader, runs => {
      setPartialRuns(runs)
      setHighestRunIndex(highestRunIndex => Math.max(highestRunIndex, ...runs.map(run => run.index)))
    })
    await refreshActiveItem(versionID)

    let didFinish = false
    setPartialRuns(runs => {
      const failedRuns = runs.filter(run => run.failed)
      didFinish = failedRuns.length === 0
      return failedRuns
    })
    setRunning(false)

    return didFinish
  }

  return [runVersion, partialRuns, isRunning, highestRunIndex] as const
}
