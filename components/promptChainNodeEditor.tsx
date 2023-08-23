import { ChainItem, ModelProvider, PromptChainItem, PromptVersion } from '@/types'
import { PromptCache } from './chainView'
import Checkbox from './checkbox'
import VersionTimeline from './versionTimeline'
import PromptPanel from './promptPanel'
import { RefreshContext } from './refreshContext'
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
  checkProviderAvailable,
  selectVersion,
  setModifiedVersion,
}: {
  node: PromptChainItem
  index: number
  items: ChainItem[]
  toggleIncludeContext: (includeContext: boolean) => void
  promptCache: PromptCache
  checkProviderAvailable: (provider: ModelProvider) => boolean
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const loadedPrompt = promptCache.promptForItem(node)
  const activeVersion = promptCache.versionForItem(node)

  const minVersionHeight = 230
  const [promptHeight, setPromptHeight] = useState(1)
  return (
    <RefreshContext.Provider value={{ refreshPrompt: () => promptCache.refreshPrompt(node.promptID).then(_ => {}) }}>
      {loadedPrompt && activeVersion ? (
        <Allotment vertical>
          <Allotment.Pane minSize={minVersionHeight}>
            <div className='flex flex-col h-full gap-4'>
              <VersionTimeline
                prompt={loadedPrompt}
                activeVersion={activeVersion}
                setActiveVersion={selectVersion}
                tabSelector={() => <SingleTabHeader label='Prompt versions' />}
              />
              {items.slice(0, index).some(IsPromptChainItem) && (
                <div className='self-start'>
                  <Checkbox
                    label='Include previous chain context into prompt'
                    checked={!!node.includeContext}
                    setChecked={toggleIncludeContext}
                  />
                </div>
              )}
            </div>
          </Allotment.Pane>
          <Allotment.Pane minSize={Math.min(350, promptHeight)} preferredSize={promptHeight}>
            <div className='h-full px-4 pt-4'>
              <PromptPanel
                version={activeVersion}
                setModifiedVersion={setModifiedVersion}
                checkProviderAvailable={checkProviderAvailable}
                onUpdatePreferredHeight={setPromptHeight}
              />
            </div>
          </Allotment.Pane>
        </Allotment>
      ) : (
        <div className='flex-grow' />
      )}
    </RefreshContext.Provider>
  )
}
