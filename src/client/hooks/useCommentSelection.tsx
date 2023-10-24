import { ChainVersion, PromptVersion } from '@/types'
import { useState } from 'react'

export default function useCommentSelection(
  activeVersion: PromptVersion | ChainVersion | undefined,
  selectVersion: (parentID: number, versionID: number) => Promise<void>,
  onSelectRun?: () => void
) {
  const [activeRunID, setActiveRunID] = useState<number>()

  const selectComment = (parentID: number, versionID: number, runID?: number) => {
    if (versionID !== activeVersion?.id) {
      setActiveRunID(undefined)
      selectVersion(parentID, versionID).then(() =>
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
