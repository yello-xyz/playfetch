import { ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import VersionTimeline from '../versions/versionTimeline'
import PromptPanel from '../prompts/promptPanel'
import { Allotment } from 'allotment'
import { SingleTabHeader } from '../tabSelector'
import { useState } from 'react'
import promptIcon from '@/public/prompt.svg'
import usePromptVersion from '@/src/client/hooks/usePromptVersion'
import { ChainPromptCache } from '../../src/client/hooks/useChainPromptCache'

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
  const [currentVersion, updatePrompt, updateConfig] = usePromptVersion(activeVersion, setModifiedVersion)

  const minVersionHeight = 120
  const [promptHeight, setPromptHeight] = useState(1)
  const minHeight = promptHeight + 16
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <VersionTimeline
          activeItem={prompt}
          versions={prompt.versions}
          activeVersion={activeVersion}
          setActiveVersion={selectVersion}
          tabSelector={() => <SingleTabHeader label='Prompt versions' icon={promptIcon} />}
        />
      </Allotment.Pane>
      <Allotment.Pane minSize={minHeight} preferredSize={minHeight}>
        <PromptPanel
          version={currentVersion}
          updatePrompt={updatePrompt}
          updateConfig={updateConfig}
          setPreferredHeight={setPromptHeight}
        />
      </Allotment.Pane>
    </Allotment>
  )
}
