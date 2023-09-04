import api from '@/src/client/api'
import { useState } from 'react'
import { ActivePrompt, PromptVersion } from '@/types'
import { PromptVersionsEqual } from '@/src/common/versionsEqual'

export default function useSavePrompt(
  activePrompt: ActivePrompt | undefined,
  activeVersion: PromptVersion | undefined,
  setActiveVersion: (version: PromptVersion) => void
) {
  const [modifiedVersion, setModifiedVersion] = useState<PromptVersion>()

  const savePrompt = async (onSaved?: ((versionID: number) => Promise<void>) | (() => void)) => {
    const versionNeedsSaving =
      activePrompt &&
      activeVersion &&
      modifiedVersion &&
      modifiedVersion.prompts.main.trim().length > 0 &&
      !PromptVersionsEqual(activeVersion, modifiedVersion)
    setModifiedVersion(undefined)
    if (!versionNeedsSaving) {
      return activeVersion?.id
    }
    const equalPreviousVersion = activePrompt.versions.find(version => PromptVersionsEqual(version, modifiedVersion))
    if (equalPreviousVersion) {
      setActiveVersion(equalPreviousVersion)
      return equalPreviousVersion.id
    }
    const versionID = await api.updatePrompt(
      activePrompt.id,
      modifiedVersion.prompts,
      modifiedVersion.config,
      activeVersion.id
    )
    await onSaved?.(versionID)
    return versionID
  }

  return [savePrompt, setModifiedVersion] as const
}
