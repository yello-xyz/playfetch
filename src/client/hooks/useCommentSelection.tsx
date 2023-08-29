import { ChainVersion, PromptVersion } from '@/types'
import { useState } from 'react'

export default function useCommentSelection<T extends PromptVersion | ChainVersion>(
  activeVersion: T,
  setActiveVersion: (version: T) => void,
  onSelectRun?: () => void
) {
  const [activeRunID, setActiveRunID] = useState<number>()

  const selectComment = (version: T, runID?: number) => {
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
