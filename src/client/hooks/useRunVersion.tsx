import api from '@/src/client/api'
import { useState } from 'react'
import { PartialRun, PromptInputs } from '@/types'
import { useRefreshActiveItem } from '../context/refreshContext'

export default function useRunVersion() {
  const refreshActiveItem = useRefreshActiveItem()
  const [isRunning, setRunning] = useState(false)
  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])

  const runVersion = async (getVersion: () => Promise<number>, inputs: PromptInputs[]) => {
    setRunning(true)
    setPartialRuns([])
    const versionID = await getVersion()
    const streamReader = await api.runVersion(versionID, inputs)
    const runs = {} as { [index: number]: PartialRun }
    while (streamReader) {
      const { done, value } = await streamReader.read()
      if (done) {
        break
      }
      const text = await new Response(value).text()
      const lines = text.split('\n')
      for (const line of lines.filter(line => line.trim().length > 0)) {
        const data = line.split('data:').slice(-1)[0]
        const { index, message, cost, duration, timestamp, failed } = JSON.parse(data)
        const previousOutput = runs[index]?.output ?? ''
        const output = message ? `${previousOutput}${message}` : previousOutput
        runs[index] = { id: index, output, cost, duration, timestamp, failed }
      }
      setPartialRuns(
        Object.entries(runs)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, run]) => run)
      )
    }
    await refreshActiveItem(versionID)

    setPartialRuns(runs => runs.filter(run => run.timestamp))

    setRunning(false)
  }

  return [runVersion, partialRuns, isRunning] as const
}
