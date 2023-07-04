import { ActiveProject, ActivePrompt, Prompt, Version } from '@/types'
import BuildChainTab from './buildChainTab'
import { useState } from 'react'
import TestChainTab from './testChainTab'
import { MainViewTab } from './promptTabView'
import useInputValues from './inputValues'

export type ActiveChainItem = { prompt: ActivePrompt; version: Version; output?: string }
export type ChainItem = { prompt: Prompt; version: undefined; output: undefined } | ActiveChainItem

export default function ChainTabView({ activeTab, project }: { activeTab: MainViewTab; project: ActiveProject }) {
  const [chain, setChain] = useState<ChainItem[]>([])

  const isActiveChainItem = (item: ChainItem): item is ActiveChainItem => !!item.version
  const activeChain = chain.filter(isActiveChainItem)

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    activeChain[0]?.prompt?.inputs ?? [],
    project.id,
    activeTab
  )

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return <BuildChainTab chain={chain} setChain={setChain} prompts={project.prompts} />
      case 'test':
        return activeChain.length ? (
          <TestChainTab
            chain={activeChain}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        ) : null
      case 'publish':
        return null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
