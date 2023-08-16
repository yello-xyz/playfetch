import { ChainItem, ModelProvider, PromptChainItem, Version } from '@/types'
import { PromptCache } from './chainView'
import Checkbox from './checkbox'
import Label from './label'
import VersionTimeline from './versionTimeline'
import PromptPanel from './promptPanel'
import { RefreshContext } from './refreshContext'
import { IsPromptChainItem } from './chainNode'
import { Allotment } from 'allotment'

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
  selectVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const loadedPrompt = promptCache.promptForItem(node)
  const activeVersion = promptCache.versionForItem(node)

  const minHeight = 230
  return (
    <RefreshContext.Provider value={{ refreshPrompt: () => promptCache.refreshPrompt(node.promptID).then(_ => {}) }}>
      {loadedPrompt && activeVersion ? (
        <Allotment vertical>
          <Allotment.Pane minSize={minHeight}>
            <div className='flex flex-col h-full gap-4 px-4'>
              <VersionTimeline
                prompt={loadedPrompt}
                activeVersion={activeVersion}
                setActiveVersion={selectVersion}
                tabSelector={<Label>Prompt Versions</Label>}
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
          <Allotment.Pane minSize={minHeight} preferredSize={minHeight}>
            <div className='h-full px-4 pt-4'>
              <PromptPanel
                version={activeVersion}
                setModifiedVersion={setModifiedVersion}
                checkProviderAvailable={checkProviderAvailable}
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
