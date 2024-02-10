import { ChainVersion, PromptVersion } from '@/types'
import { useState } from 'react'

export default function useCommentSelection(
  activeVersion: PromptVersion | ChainVersion | undefined,
  selectVersion: (parentID: number, versionID: number) => Promise<void>
) {
  const [focusRunID, setFocusRunID] = useState<number>()

  const [previousVersionID, setPreviousVersionID] = useState(activeVersion?.id)
  if (activeVersion?.id !== previousVersionID) {
    setPreviousVersionID(activeVersion?.id)
    setFocusRunID(undefined)
  }

  const selectComment = (parentID: number, versionID: number, runID?: number | null) => {
    if (versionID !== activeVersion?.id) {
      setFocusRunID(undefined)
      selectVersion(parentID, versionID).then(() => setTimeout(() => setFocusRunID(runID ?? undefined)))
    } else {
      setFocusRunID(runID ?? undefined)
    }
  }

  return [focusRunID, selectComment] as const
}
