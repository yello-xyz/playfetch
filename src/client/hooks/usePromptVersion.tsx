import { PromptVersion } from '@/types'
import useInitialState from './useInitialState'
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'

export default function usePromptVersion(
  activeVersion: PromptVersion,
  setModifiedVersion: (version: PromptVersion) => void
) {
  const [currentVersion, setCurrentVersion] = useInitialState(activeVersion, (a, b) => a.id === b.id)
  const updateVersion = (version: PromptVersion) => {
    setCurrentVersion(version)
    setModifiedVersion(version)
  }

  const isDirty = !PromptVersionsAreEqual(activeVersion, currentVersion)

  return [updateVersion, currentVersion, isDirty] as const
}
