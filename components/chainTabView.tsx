import { ActivePrompt, Prompt, Version } from '@/types'
import BuildChainTab from './buildChainTab'
import { useState } from 'react'
import TestChainTab from './testChainTab'

export type ActivePromptTab = 'play' | 'test' | 'publish'
export type ActiveChainItem = { prompt: ActivePrompt; version: Version; output?: string }
export type ChainItem = { prompt: Prompt; version: undefined; output: undefined } | ActiveChainItem

export default function ChainTabView({ activeTab, prompts }: { activeTab: ActivePromptTab; prompts: Prompt[] }) {
  const [chain, setChain] = useState<ChainItem[]>([])

  const isActiveChainItem = (item: ChainItem): item is ActiveChainItem => !!item.version
  const activeChain = chain.filter(isActiveChainItem)

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return <BuildChainTab chain={chain} setChain={setChain} prompts={prompts} />
      case 'test':
        return activeChain.length ? <TestChainTab chain={activeChain} /> : null
      case 'publish':
        return null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
