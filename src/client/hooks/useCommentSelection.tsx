import { ChainVersion, PromptVersion } from '@/types'
import { useState } from 'react'

export default function useCommentSelection<Version extends PromptVersion | ChainVersion>(
  activeVersion: Version,
  setActiveVersion: (version: Version) => void,
  onSelectRun?: () => void
) {
  const [activeRunID, setActiveRunID] = useState<number>()

  const selectComment = (version: Version, runID?: number) => {
    if (version.id !== activeVersion.id) {
      setActiveRunID(undefined)
      setActiveVersion(version)
      setTimeout(() => {
        onSelectRun?.()
        setActiveRunID(runID)
      }, 1000)
    } else {
      onSelectRun?.()
      setActiveRunID(runID)
    }
  }

  return [activeRunID, selectComment] as const
}
