import { ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import useInitialState from './useInitialState'
import { ChainVersionsAreEqual, PromptVersionsAreEqual } from '@/src/common/versionsEqual'

export default function useModifiedVersion<Version extends PromptVersion | ChainVersion>(
  activeVersion: Version,
  setModifiedVersion: (version: Version) => void
) {
  const [currentVersion, setCurrentVersion] = useInitialState(activeVersion, (a, b) => a.id === b.id)
  const updateVersion = (version: Version) => {
    setCurrentVersion(version)
    setModifiedVersion(version)
  }

  const isDirty = IsPromptVersion(activeVersion)
    ? !PromptVersionsAreEqual(activeVersion, currentVersion as PromptVersion)
    : !ChainVersionsAreEqual(activeVersion, currentVersion as ChainVersion)


  return [currentVersion, updateVersion, isDirty] as const
}
