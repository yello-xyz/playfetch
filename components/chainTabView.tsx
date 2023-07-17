import { ActiveChain, ActivePrompt, Prompt, RunConfig, Version } from '@/types'
import BuildChainTab from './buildChainTab'
import { useState } from 'react'
import TestChainTab from './testChainTab'
import { MainViewTab } from './promptTabView'
import useInputValues from './inputValues'
import PublishChainTab from './publishChainTab'

export type ChainItem = { prompt: Prompt; version?: Version; output?: string; includeContext?: boolean } | RunConfig
export type LoadedChainItem = { prompt: ActivePrompt; version: Version; output?: string; includeContext?: boolean }
export const IsLoadedChainItem = (item: ChainItem): item is LoadedChainItem =>
  'version' in item && item.version !== undefined

export default function ChainTabView({ activeTab, activeChain }: { activeTab: MainViewTab; activeChain: ActiveChain }) {
  const previousChain: ChainItem[] = (activeChain.endpoints[0]?.chain ?? []).map(item => ({
    versionID: item.versionID,
    output: item.output,
    includeContext: item.includeContext,
  }))
  const [chain, setChain] = useState(previousChain)

  const loadedChain = chain.filter(IsLoadedChainItem)

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    activeChain.inputs,
    activeChain.projectID,
    activeTab
  )

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return <BuildChainTab chain={chain} setChain={setChain} prompts={activeChain.prompts} />
      case 'test':
        return loadedChain.length ? (
          <TestChainTab
            chain={loadedChain}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        ) : null
      case 'publish':
        return loadedChain.length ? <PublishChainTab chain={loadedChain} activeChain={activeChain} /> : null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
