import { ActivePrompt, PromptVersion } from '@/types'
import useInitialState from './useInitialState'
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'

export default function usePromptVersions(
  prompt: ActivePrompt,
  activeVersion: PromptVersion,
  setModifiedVersion: (version: PromptVersion) => void
) {
  const [currentVersion, setCurrentVersion] = useInitialState(activeVersion, (a, b) => a.id === b.id)
  const updateVersion = (version: PromptVersion) => {
    const modifiedVersion = { ...version, didRun: false }
    setCurrentVersion(modifiedVersion)
    setModifiedVersion(modifiedVersion)
  }

  const isDirty = !PromptVersionsAreEqual(activeVersion, currentVersion)
  const versions = isDirty ? [...prompt.versions.filter(version => version.didRun), currentVersion] : prompt.versions

  return [versions, updateVersion, currentVersion, isDirty] as const
}
