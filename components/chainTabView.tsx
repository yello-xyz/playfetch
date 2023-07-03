import { Prompt } from '@/types'
import BuildChainTab from './buildChainTab';

export type ActivePromptTab = 'play' | 'test' | 'publish'

export default function ChainTabView({ activeTab, prompts }: { activeTab: ActivePromptTab; prompts: Prompt[] }) {
  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return <BuildChainTab prompts={prompts} />
      case 'test':
        return null
      case 'publish':
        return null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
