import { ActivePrompt, ChainItem, PromptChainItem, PromptVersion } from '@/types'
import { PromptCache } from './chainView'
import Checkbox from './checkbox'
import VersionTimeline from './versionTimeline'
import PromptPanel from './promptPanel'
import { IsPromptChainItem } from './chainNode'
import { Allotment } from 'allotment'
import { SingleTabHeader } from './tabSelector'
import { useState } from 'react'
import promptIcon from '@/public/prompt.svg'
import { LoadPendingVersion } from './promptView'
import useInitialState from '@/src/client/hooks/useInitialState'

export default function PromptChainNodeEditor({
  node,
  index,
  items,
  toggleIncludeContext,
  promptCache,
  selectVersion,
  setModifiedVersion,
}: {
  node: PromptChainItem
  index: number
  items: ChainItem[]
  toggleIncludeContext: (includeContext: boolean) => void
  promptCache: PromptCache
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const loadedPrompt = promptCache.promptForItem(node)
  const activeVersion = promptCache.versionForItem(node)

  return loadedPrompt && activeVersion ? (
    <PromptEditor
      prompt={loadedPrompt}
      activeVersion={activeVersion}
      remainingItems={items.slice(0, index)}
      includeContext={!!node.includeContext}
      toggleIncludeContext={toggleIncludeContext}
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
  remainingItems,
  includeContext,
  toggleIncludeContext,
  selectVersion,
  setModifiedVersion,
}: {
  prompt: ActivePrompt
  activeVersion: PromptVersion
  remainingItems: ChainItem[]
  includeContext: boolean
  toggleIncludeContext: (includeContext: boolean) => void
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const [currentVersion, setCurrentVersion] = useInitialState(activeVersion, (a, b) => a.id === b.id)
  const updateVersion = (version: PromptVersion) => {
    setCurrentVersion(version)
    setModifiedVersion(version)
  }

  const loadPendingVersion = LoadPendingVersion(prompt.versions, activeVersion, selectVersion, currentVersion)

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
              versions={prompt.versions.filter(version => version.didRun)}
              activeVersion={activeVersion}
              setActiveVersion={selectVersion}
              tabSelector={() => <SingleTabHeader label='Prompt versions' icon={promptIcon} />}
            />
          </div>
          {remainingItems.some(IsPromptChainItem) && (
            <div className='self-start w-full px-4 py-2 border-t border-gray-200'>
              <Checkbox
                label='Include previous chain context into prompt'
                checked={includeContext}
                setChecked={toggleIncludeContext}
              />
            </div>
          )}
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={minHeight} preferredSize={minHeight}>
        <div className='h-full px-4 pt-4 bg-white'>
          <PromptPanel
            version={activeVersion}
            setModifiedVersion={updateVersion}
            loadPendingVersion={loadPendingVersion}
            setPreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  )
}
