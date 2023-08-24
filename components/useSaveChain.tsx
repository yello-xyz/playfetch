import api from '@/src/client/api'
import { ActiveChain, ChainItemWithInputs, ChainVersion } from '@/types'
import { ChainVersionsEqual } from '@/src/common/versionsEqual'

export default function useSaveChain(
  activeChain: ActiveChain,
  activeVersion: ChainVersion,
  setActiveVersion: (version: ChainVersion) => void
) {
  const saveChain = async (
    items: ChainItemWithInputs[],
    onSaved?: ((versionID: number) => Promise<void>) | (() => void)
  ) => {
    const versionNeedsSaving = activeChain && activeVersion && !ChainVersionsEqual(activeVersion, { items })
    if (!versionNeedsSaving) {
      return activeVersion?.id
    }
    const equalPreviousVersion = activeChain.versions.find(version => ChainVersionsEqual(version, { items }))
    if (equalPreviousVersion) {
      setActiveVersion(equalPreviousVersion)
      return equalPreviousVersion.id
    }
    const versionID = await api.updateChain(activeChain.id, items, activeVersion.id)
    await onSaved?.(versionID)
    return versionID
  }

  return saveChain
}
