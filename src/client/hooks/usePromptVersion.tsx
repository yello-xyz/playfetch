import { ActivePrompt, ChainVersion, PromptConfig, PromptVersion, Prompts } from '@/types'
import useInitialState from './useInitialState'
import { PromptVersionsAreEqual } from '@/src/common/versionsEqual'
import { SupportedPromptKeysForModel, SupportsJsonMode, SupportsSeed } from '@/src/common/providerMetadata'

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
      config = {
        ...config,
        seed: SupportsSeed(config.model) ? config.seed : undefined,
        jsonMode: SupportsJsonMode(config.model) ? config.jsonMode ?? false : undefined,
      }
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

  const versions = isDirty
    ? [
        ...prompt.versions.filter(version => version.didRun),
        AugmentVersion(draftVersion ?? DummyVersion, currentVersion),
      ]
    : prompt.versions

  return [currentVersion, versions, updatePrompt, updateConfig, isDirty] as const
}

type PartialVersion = Omit<PromptVersion, 'previousID' | 'prompts' | 'config' | 'userID' | 'parentID' | 'timestamp'>

const AugmentVersion = (partialVersion: PartialVersion | PromptVersion, version: PromptVersion) => ({
  ...partialVersion,
  previousID: version.id,
  prompts: version.prompts,
  config: version.config,
  userID: version.userID,
  parentID: version.parentID,
  timestamp: version.timestamp,
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
