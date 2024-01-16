import { ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import usePromptVersion from '@/src/client/hooks/usePromptVersion'
import { ChainPromptCache } from '../../src/client/hooks/useChainPromptCache'
import PromptTabs from '../prompts/promptTabs'
import { usePromptTabs } from '@/src/client/context/userPresetsContext'

export default function PromptNodeEditor({
  item,
  promptCache,
  selectVersion,
  setModifiedVersion,
}: {
  item: PromptChainItem
  promptCache: ChainPromptCache
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const loadedPrompt = promptCache.promptForItem(item)
  const activeVersion = promptCache.versionForItem(item)

  return loadedPrompt && activeVersion ? (
    <PromptEditor
      prompt={loadedPrompt}
      activeVersion={activeVersion}
      selectVersion={selectVersion}
      setModifiedVersion={setModifiedVersion}
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
}: {
  prompt: ActivePrompt
  activeVersion: PromptVersion
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
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
    />
  )
}
