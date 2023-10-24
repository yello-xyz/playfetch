import { ChainVersion, PromptVersion } from '@/types'
import { useState } from 'react'

export default function useCommentSelection(
  activeVersion: PromptVersion | ChainVersion | undefined,
  setActiveVersion: (version: PromptVersion | ChainVersion) => Promise<void>,
  onSelectRun?: () => void
) {
  const [activeRunID, setActiveRunID] = useState<number>()

  const selectComment = (version: PromptVersion | ChainVersion, runID?: number) => {
    if (version.id !== activeVersion?.id) {
      setActiveRunID(undefined)
      setActiveVersion(version).then(() =>
        setTimeout(() => {
          onSelectRun?.()
          setActiveRunID(runID)
        }, 1000)
      )
    } else {
      onSelectRun?.()
      setActiveRunID(runID)
    }
  }

  return [activeRunID, selectComment] as const
}
