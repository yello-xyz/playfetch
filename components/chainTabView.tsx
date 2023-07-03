import { ActivePrompt, Prompt, Version } from '@/types'
import BuildChainTab from './buildChainTab';
import { useState } from 'react';

export type ActivePromptTab = 'play' | 'test' | 'publish'

export type ChainItem =
  | { prompt: Prompt; version: undefined; output: undefined }
  | { prompt: ActivePrompt; version: Version; output?: string }

export default function ChainTabView({ activeTab, prompts }: { activeTab: ActivePromptTab; prompts: Prompt[] }) {
  const [chain, setChain] = useState<ChainItem[]>([])

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return <BuildChainTab chain={chain} setChain={setChain} prompts={prompts} />
      case 'test':
        return null
      case 'publish':
        return null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
