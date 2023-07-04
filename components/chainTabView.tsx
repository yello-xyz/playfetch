import { ActiveProject, ActivePrompt, Prompt, ProperProject, Version } from '@/types'
import BuildChainTab from './buildChainTab'
import { useState } from 'react'
import TestChainTab from './testChainTab'
import { MainViewTab } from './promptTabView'
import useInputValues from './inputValues'
import PublishChainTab from './publishChainTab'

export type ActiveChainItem = { prompt: ActivePrompt; version: Version; output?: string }
export type ChainItem = { prompt: Prompt; version: undefined | { id: number }; output?: undefined } | ActiveChainItem
export const IsActiveChainItem = (item: ChainItem): item is ActiveChainItem =>
  !!item.version && 'prompt' in item.version

export default function ChainTabView({
  activeTab,
  project,
}: {
  activeTab: MainViewTab
  project: ActiveProject & ProperProject
}) {
  // TODO generalise this and expose all previous chains in the project
  const previousChain = (project.chains[0] ?? []).map(item => ({
    prompt: project.prompts.find(prompt => prompt.id === item.promptID),
    version: { id: item.versionID },
    output: item.output,
  }))
  const initialChain = previousChain.every(item => !!item.prompt) ? (previousChain as ChainItem[]) : []
  const [chain, setChain] = useState(initialChain)

  const activeChain = chain.filter(IsActiveChainItem)

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    project.inputs,
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
        return activeChain.length ? <PublishChainTab chain={activeChain} project={project} /> : null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
