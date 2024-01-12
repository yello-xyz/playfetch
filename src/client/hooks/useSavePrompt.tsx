import api from '@/src/client/api'
import { useState } from 'react'
import { ActivePrompt, PromptVersion } from '@/types'
import { PromptConfigsAreEqual, PromptVersionsAreEqual, VersionHasNonEmptyPrompts } from '@/src/common/versionsEqual'

type OnSaved = (versionID: number) => Promise<void> | void

export default function useSavePrompt(
  activePrompt: ActivePrompt | undefined,
  activeVersion: PromptVersion | undefined,
  setActiveVersion: (version: PromptVersion) => void
) {
  const [modifiedVersion, setModifiedVersion] = useState<PromptVersion>()

  const saveVersion = async (
    activePrompt: ActivePrompt | undefined,
    activeVersion: PromptVersion | undefined,
    modifiedVersion: PromptVersion | undefined,
    onSaved?: OnSaved
  ) => {
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
      activeVersion.id
    )
    await onSaved?.(versionID)
    return versionID
  }

  const savePrompt = (onSaved?: OnSaved) => saveVersion(activePrompt, activeVersion, modifiedVersion, onSaved)

  const resavePrompt = (activePrompt: ActivePrompt, activeVersion: PromptVersion, onSaved?: OnSaved) => {
    let didResave = false
    setModifiedVersion(modifiedVersion => {
      if (!didResave) {
        didResave = true
        saveVersion(activePrompt, activeVersion, modifiedVersion, onSaved)
      }
      return undefined
    })
  }

  return [savePrompt, setModifiedVersion, resavePrompt] as const
}
