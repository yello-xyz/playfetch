import { ActivePrompt, PromptChainItem, PromptVersion } from '@/types'
import VersionTimeline from '../versions/versionTimeline'
import PromptPanel from '../prompts/promptPanel'
import { Allotment } from 'allotment'
import { SingleTabHeader } from '../tabSelector'
import { useState } from 'react'
import promptIcon from '@/public/prompt.svg'
import useModifiedVersion from '@/src/client/hooks/useModifiedVersion'
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
  const [currentVersion, updateVersion] = useModifiedVersion(activeVersion, setModifiedVersion)

  const minVersionHeight = 120
  const [promptHeight, setPromptHeight] = useState(1)
  const minHeight = promptHeight + 16
  return (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <div className='flex flex-col h-full'>
          <div className='flex-1 overflow-y-auto'>
            <VersionTimeline
              activeItem={prompt}
              versions={prompt.versions}
              activeVersion={activeVersion}
              setActiveVersion={selectVersion}
              tabSelector={() => <SingleTabHeader label='Prompt versions' icon={promptIcon} />}
            />
          </div>
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={minHeight} preferredSize={minHeight}>
        <div className='h-full px-4 pt-4 bg-white'>
          <PromptPanel
            version={activeVersion}
            setModifiedVersion={updateVersion}
            setPreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
