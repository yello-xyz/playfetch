import { ActiveChain, ActiveProject, ActivePrompt, Prompt, RunConfig, Version } from '@/types'
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

export default function ChainTabView({ activeTab, chain }: { activeTab: MainViewTab; chain: ActiveChain }) {
  return <div>{chain.name}</div>
}

function OldChainTabView({ activeTab, project }: { activeTab: MainViewTab; project: ActiveProject }) {
    // TODO generalise this and expose all previous chains in the project
  const previousChain: ChainItem[] = (project.endpoints[0]?.chain ?? []).map(item => ({
    versionID: item.versionID,
    output: item.output,
    includeContext: item.includeContext,
  }))
  const [chain, setChain] = useState(previousChain)

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
