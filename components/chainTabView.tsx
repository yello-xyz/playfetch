import { ActiveProject, Prompt, ProperProject, Version } from '@/types'
import BuildChainTab from './buildChainTab'
import { useState } from 'react'
import TestChainTab from './testChainTab'
import { MainViewTab } from './promptTabView'
import useInputValues from './inputValues'
import PublishChainTab from './publishChainTab'

export type ChainItem = { prompt: Prompt; version: undefined | { id: number }; output?: string }
export type LoadedChainItem = ChainItem & { version: Version }
export const IsLoadedChainItem = (item: ChainItem): item is LoadedChainItem =>
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

  const loadedChain = chain.filter(IsLoadedChainItem)

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
        return loadedChain.length ? (
          <TestChainTab
            chain={loadedChain}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        ) : null
      case 'publish':
        return loadedChain.length ? <PublishChainTab chain={loadedChain} project={project} /> : null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
