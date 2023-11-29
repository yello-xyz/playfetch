import { ChainVersion, PromptVersion } from '@/types'
import { useState } from 'react'

export default function useCommentSelection(
  activeVersion: PromptVersion | ChainVersion | undefined,
  selectVersion: (parentID: number, versionID: number) => Promise<void>
) {
  const [focusRunID, setFocusRunID] = useState<number>()

  const selectComment = (parentID: number, versionID: number, runID?: number) => {
    if (versionID !== activeVersion?.id) {
      setFocusRunID(undefined)
      selectVersion(parentID, versionID).then(() => setTimeout(() => setFocusRunID(runID), 1000))
    } else {
      setFocusRunID(runID)
    }
  }

  return [focusRunID, selectComment] as const
}
