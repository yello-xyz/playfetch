import api from '@/src/client/api'
import { ActiveChain, ChainItemWithInputs, ChainVersion } from '@/types'
import { ChainVersionsAreEqual } from '@/src/common/versionsEqual'
import { useLoggedInUser } from '../context/userContext'

export default function useSaveChain(
  activeChain: ActiveChain | undefined,
  activeVersion: ChainVersion | undefined,
  setActiveVersion: (version: ChainVersion) => void
) {
  const saveChain = async (
    items: ChainItemWithInputs[],
    onSaved?: ((versionID: number) => Promise<void>) | (() => void)
  ) => {
    const user = useLoggedInUser()

    const versionNeedsSaving = activeChain && activeVersion && !ChainVersionsAreEqual(activeVersion, { items })
    if (!versionNeedsSaving) {
      return activeVersion?.id
    }
    const equalPreviousVersion = activeChain.versions.find(version => ChainVersionsAreEqual(version, { items }))
    if (equalPreviousVersion) {
      setActiveVersion(equalPreviousVersion)
      return equalPreviousVersion.id
    }
    const currentVersion =
      activeChain.versions.findLast(version => version.userID === user.id && version.runs.length === 0) ?? activeVersion
    const versionID = await api.updateChain(activeChain.id, items, currentVersion.id, activeVersion.id)
    await onSaved?.(versionID)
    return versionID
  }

  return saveChain
}
