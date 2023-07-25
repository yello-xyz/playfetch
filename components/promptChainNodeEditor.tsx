import { ChainItem, ModelProvider, PromptChainItem, Version } from '@/types'
import { ReactNode } from 'react'
import { PromptCache } from './chainView'
import Checkbox from './checkbox'
import Label from './label'
import VersionTimeline from './versionTimeline'
import PromptPanel from './promptPanel'
import { RefreshContext } from './refreshContext'
import { IsPromptChainItem } from './chainNode'

export default function PromptChainNodeEditor({
  node,
  index,
  items,
  toggleIncludeContext,
  promptCache,
  outputMapper,
  checkProviderAvailable,
  selectVersion,
  setModifiedVersion,
}: {
  node: PromptChainItem
  index: number
  items: ChainItem[]
  toggleIncludeContext: (includeContext: boolean) => void
  promptCache: PromptCache
  outputMapper: (node: PromptChainItem) => ReactNode
  checkProviderAvailable: (provider: ModelProvider) => boolean
  selectVersion: (version: Version) => void
  setModifiedVersion: (version: Version) => void
}) {
  const loadedPrompt = promptCache.promptForItem(node)
  const activeVersion = promptCache.versionForItem(node)

  return (
    <RefreshContext.Provider value={{ refreshPrompt: () => promptCache.refreshPrompt(node.promptID).then(_ => {}) }}>
      <div className='flex flex-col justify-between flex-grow h-full gap-4'>
        {outputMapper(node)}
        {loadedPrompt && activeVersion && (
          <>
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
            <PromptPanel
              version={activeVersion}
              setModifiedVersion={setModifiedVersion}
              checkProviderAvailable={checkProviderAvailable}
            />
          </>
        )}
      </div>
    </RefreshContext.Provider>
  )
}
