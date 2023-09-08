import { ChainItem, PromptChainItem, PromptVersion } from '@/types'
import { PromptCache } from './chainView'
import Checkbox from './checkbox'
import VersionTimeline from './versionTimeline'
import PromptPanel from './promptPanel'
import { IsPromptChainItem } from './chainNode'
import { Allotment } from 'allotment'
import { SingleTabHeader } from './tabSelector'
import { useState } from 'react'

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

  const minVersionHeight = 120
  const [promptHeight, setPromptHeight] = useState(1)
  return loadedPrompt && activeVersion ? (
    <Allotment vertical>
      <Allotment.Pane minSize={minVersionHeight}>
        <div className='flex flex-col h-full'>
          <div className='flex-1 overflow-y-auto'>
            <VersionTimeline
              activeItem={loadedPrompt}
              versions={loadedPrompt.versions}
              activeVersion={activeVersion}
              setActiveVersion={selectVersion}
              tabSelector={() => <SingleTabHeader label='Prompt versions' />}
            />
          </div>
          {items.slice(0, index).some(IsPromptChainItem) && (
            <div className='self-start w-full px-4 py-2 border-t border-gray-200'>
              <Checkbox
                label='Include previous chain context into prompt'
                checked={!!node.includeContext}
                setChecked={toggleIncludeContext}
              />
            </div>
          )}
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={promptHeight} preferredSize={promptHeight}>
        <div className='h-full px-4 pt-4 bg-white'>
          <PromptPanel
            version={activeVersion}
            setModifiedVersion={setModifiedVersion}
            onUpdatePreferredHeight={setPromptHeight}
          />
        </div>
      </Allotment.Pane>
    </Allotment>
  ) : (
    <div className='grow' />
  )
}
