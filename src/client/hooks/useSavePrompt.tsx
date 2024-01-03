import api from '@/src/client/api'
import { useState } from 'react'
import { ActivePrompt, PromptVersion } from '@/types'
import { PromptConfigsAreEqual, PromptVersionsAreEqual, VersionHasNonEmptyPrompts } from '@/src/common/versionsEqual'

export default function useSavePrompt(
  activePrompt: ActivePrompt | undefined,
  activeVersion: PromptVersion | undefined,
  setActiveVersion: (version: PromptVersion) => void
) {
  const [modifiedVersion, setModifiedVersion] = useState<PromptVersion>()

  const savePrompt = async (onSaved?: (versionID: number) => Promise<void> | void, markAsRun?: boolean) => {
    const versionNeedsSaving =
      activePrompt &&
      activeVersion &&
      modifiedVersion &&
      !PromptVersionsAreEqual(activeVersion, modifiedVersion) &&
      (VersionHasNonEmptyPrompts(modifiedVersion) ||
        !PromptConfigsAreEqual(activeVersion.config, modifiedVersion.config))
    setModifiedVersion(undefined)
    if (!versionNeedsSaving) {
      return activeVersion?.id
    }
    const equalPreviousVersion = activePrompt.versions.find(version => PromptVersionsAreEqual(version, modifiedVersion))
    if (equalPreviousVersion) {
      setActiveVersion(equalPreviousVersion)
      return equalPreviousVersion.id
    }
    const currentVersion = activePrompt.versions.findLast(version => !version.didRun) ?? activeVersion
    const versionID = await api.updatePrompt(
      activePrompt.id,
      modifiedVersion.prompts,
      modifiedVersion.config,
      currentVersion.id,
      activeVersion.id,
      markAsRun
    )
    await onSaved?.(versionID)
    return versionID
  }

  return [savePrompt, setModifiedVersion] as const
}
