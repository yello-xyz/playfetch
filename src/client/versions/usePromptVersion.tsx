import { ActivePrompt, ChainVersion, PromptConfig, PromptVersion, Prompts } from '@/types'
import useInitialState from '@/src/client/components/useInitialState'
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import { ValidatePromptConfig } from '@/src/common/providerMetadata'
import { useEffect, useState } from 'react'
import { useLoggedInUser } from '@/src/client/users/userContext'
import { SupportedPromptKeysForModel } from '@/src/client/prompts/promptKeys'

export default function usePromptVersion(
  prompt: ActivePrompt,
  activeVersion: PromptVersion,
  setModifiedVersion: (version: PromptVersion) => void
) {
  const [currentVersion, setCurrentVersion] = useInitialState(activeVersion, (a, b) => a.id === b.id)

  const isDirty = !PromptVersionsAreEqual(activeVersion, currentVersion)

  const onUpdate = (prompts: Prompts, config: PromptConfig) =>
    setTimeout(() => setModifiedVersion({ ...activeVersion, prompts, config }))

  const updateConfig = (config: PromptConfig) =>
    setCurrentVersion(currentVersion => {
      const prompts = Object.fromEntries(
        Object.entries(currentVersion.prompts).filter(([key]) =>
          SupportedPromptKeysForModel(config.model).includes(key as keyof Prompts)
        )
      ) as Prompts
      config = ValidatePromptConfig(config)
      onUpdate(prompts, config)
      return { ...currentVersion, prompts, config }
    })

  const updatePrompt = (promptKey: keyof Prompts, prompt: string) =>
    setCurrentVersion(currentVersion => {
      const prompts = { ...currentVersion.prompts, [promptKey]: prompt }
      onUpdate(prompts, currentVersion.config)
      return { ...currentVersion, prompts }
    })

  const draftVersion = prompt.versions.find(version => !version.didRun)

  const loggedInUser = useLoggedInUser()
  const versions = isDirty
    ? [
        ...prompt.versions.filter(version => version.didRun),
        AugmentVersion(draftVersion ?? DummyVersion, currentVersion, loggedInUser.id),
      ]
    : prompt.versions

  const lastVersion = versions.slice(-1)[0]
  const [previousLastVersion, setPreviousLastVersion] = useState(lastVersion)
  useEffect(() => {
    if (lastVersion.id !== previousLastVersion.id) {
      if (IsDummyVersion(previousLastVersion) && !IsDummyVersion(lastVersion)) {
        setCurrentVersion(activeVersion)
      }
      setPreviousLastVersion(lastVersion)
    }
  }, [setCurrentVersion, previousLastVersion, lastVersion, activeVersion])

  return [currentVersion, versions, updatePrompt, updateConfig, isDirty] as const
}

type PartialVersion = Omit<PromptVersion, 'previousID' | 'prompts' | 'config' | 'userID' | 'parentID' | 'timestamp'>

const AugmentVersion = (partialVersion: PartialVersion | PromptVersion, version: PromptVersion, userID: number) => ({
  ...partialVersion,
  previousID: version.id,
  prompts: version.prompts,
  config: version.config,
  parentID: version.parentID,
  timestamp: version.timestamp,
  userID,
})

const DummyVersionID = 1

const DummyVersion: PartialVersion = {
  id: DummyVersionID,
  labels: [],
  runs: [],
  comments: [],
  didRun: false,
  usedAsEndpoint: false,
  usedInChain: null,
}

export const IsDummyVersion = (version: PromptVersion | ChainVersion) => version.id === DummyVersionID
