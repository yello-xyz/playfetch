import { ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import usePromptVersion from '@/src/client/versions/usePromptVersion'
import { ChainItemCache } from './useChainItemCache'
import PromptTabs from '../prompts/promptTabs'
import { usePromptTabs } from '@/src/client/users/userPresetsContext'

export default function PromptNodeEditor({
  item,
  itemCache,
  selectVersion,
  setModifiedVersion,
  variables,
}: {
  item: PromptChainItem
  itemCache: ChainItemCache
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  variables: string[]
}) {
  const loadedPrompt = itemCache.promptForItem(item)
  const activeVersion = itemCache.versionForItem(item)

  return loadedPrompt && activeVersion ? (
    <PromptEditor
      prompt={loadedPrompt}
      activeVersion={activeVersion}
      selectVersion={selectVersion}
      setModifiedVersion={setModifiedVersion}
      variables={variables}
    />
  ) : (
    <div className='grow' />
  )
}

function PromptEditor({
  prompt,
  activeVersion,
  selectVersion,
  setModifiedVersion,
  variables,
}: {
  prompt: ActivePrompt
  activeVersion: PromptVersion
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
  variables: string[]
}) {
  const [promptTabs, setPromptTabs] = usePromptTabs()
  const [currentVersion, versions, updatePrompt, updateConfig] = usePromptVersion(
    prompt,
    activeVersion,
    setModifiedVersion
  )

  return (
    <PromptTabs
      prompt={prompt}
      versions={versions}
      activeVersion={activeVersion}
      setActiveVersion={selectVersion}
      currentVersion={currentVersion}
      updatePrompt={updatePrompt}
      updateConfig={updateConfig}
      initialTabs={promptTabs}
      persistTabs={setPromptTabs}
      variables={variables}
    />
  )
}
