import { ChainVersion, PromptVersion } from '@/types'
import useInitialState from './useInitialState'

export default function useModifiedVersion<Version extends PromptVersion | ChainVersion>(
  activeVersion: Version,
  setModifiedVersion: (version: Version) => void
) {
  const [currentVersion, setCurrentVersion] = useInitialState(activeVersion, (a, b) => a.id === b.id)
  const updateVersion = (version: Version) => {
    setCurrentVersion(version)
    setModifiedVersion(version)
  }

  return [currentVersion, updateVersion] as const
}
