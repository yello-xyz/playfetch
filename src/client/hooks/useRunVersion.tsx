import api, { StreamReader } from '@/src/client/api'
import { useState } from 'react'
import { PartialRun, PromptInputs } from '@/types'
import { useRefreshActiveItem } from '../context/refreshContext'

export const consumeStream = async (
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
      const { inputIndex, configIndex, index, message, cost, duration, timestamp, failed, isLast } = JSON.parse(data)
      if (isLast) {
        runs[inputIndex][index].isLast = true
      } else {
        const previousOutput = runs[inputIndex][index]?.output ?? ''
        const output = message ? `${previousOutput}${message}` : previousOutput
        runs[inputIndex][index] = { id: index, index: configIndex, output, cost, duration, timestamp, failed }
      }
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

export default function useRunVersion(clearLastPartialRunsOnCompletion = false) {
  const refreshActiveItem = useRefreshActiveItem()
  const [isRunning, setRunning] = useState(false)
  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [highestRunIndex, setHighestRunIndex] = useState(-1)

  const runVersion = async (getVersion: () => Promise<number>, inputs: PromptInputs[]) => {
    setRunning(true)
    setPartialRuns([])
    setHighestRunIndex(-1)
    const versionID = await getVersion()
    const streamReader = await api.runVersion(versionID, inputs)
    await consumeStream(inputs, streamReader, runs => {
      setPartialRuns(runs)
      setHighestRunIndex(Math.max(highestRunIndex, ...runs.map(run => run.index ?? 0)))
    })
    await refreshActiveItem(versionID)

    if (clearLastPartialRunsOnCompletion) {
      setPartialRuns(runs => runs.filter(run => !run.isLast))
    }

    setRunning(false)
  }

  return [runVersion, partialRuns, isRunning, highestRunIndex] as const
}
