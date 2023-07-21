import { ActiveChain, ActiveProject, ActivePrompt, ChainItem, CodeConfig, RunConfig, Version } from '@/types'
import BuildChainTab, { ExtractUnboundChainVariables } from './buildChainTab'
import { useEffect, useState } from 'react'
import TestChainTab from './testChainTab'
import { MainViewTab } from './promptTabView'
import useInputValues from './inputValues'
import api from '@/src/client/api'

type PromptChainItem = RunConfig & { promptID: number }

export const IsPromptChainItem = (item: ChainItem): item is PromptChainItem => 'promptID' in item
export const ChainItemToConfig = (item: ChainItem): RunConfig | CodeConfig =>
  IsPromptChainItem(item)
    ? {
        versionID: item.versionID,
        output: item.output,
        includeContext: item.includeContext,
      }
    : item

export type PromptCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  promptForItem: (item: PromptChainItem) => ActivePrompt | undefined
  versionForItem: (item: PromptChainItem) => Version | undefined
}

export default function ChainTabView({
  activeTab,
  chain,
  project,
}: {
  activeTab: MainViewTab
  chain: ActiveChain
  project: ActiveProject
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    chain.inputValues,
    chain.projectID,
    activeTab
  )

  const [items, setItems] = useState(chain.items)

  const [activePromptCache, setActivePromptCache] = useState<Record<number, ActivePrompt>>({})
  const promptCache: PromptCache = {
    promptForID: id => activePromptCache[id],
    promptForItem: item => activePromptCache[item.promptID],
    versionForItem: item => activePromptCache[item.promptID]?.versions.find(version => version.id === item.versionID),
  }

  useEffect(() => {
    const promptItems = items.filter(IsPromptChainItem)
    const unloadedItem = promptItems.find(item => !activePromptCache[item.promptID])
    if (unloadedItem) {
      api.getPrompt(unloadedItem.promptID).then(prompt => {
        setActivePromptCache(cache => ({ ...cache, [prompt.id]: prompt }))
        setItems(
          items.map(item =>
            IsPromptChainItem(item) && item.promptID === prompt.id
              ? {
                  ...item,
                  prompt,
                  version: prompt.versions.find(version => version.id === item.versionID),
                }
              : item
          )
        )
      })
    }
  }, [items, setItems, activePromptCache])

  const chainIsLoaded = items.every(item => !IsPromptChainItem(item) || promptCache.promptForItem(item))

  const inputs = ExtractUnboundChainVariables(items, promptCache)
  const strippedItems = items.map(item =>
    IsPromptChainItem(item) ? { promptID: item.promptID, ...ChainItemToConfig(item) } : item
  )
  const itemsKey = JSON.stringify(strippedItems)
  const [savedItemsKey, setSavedItemsKey] = useState(itemsKey)
  if (chainIsLoaded && itemsKey !== savedItemsKey) {
    setSavedItemsKey(itemsKey)
    api.updateChain(chain.id, strippedItems, inputs)
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return (
          <BuildChainTab
            items={items}
            setItems={setItems}
            prompts={chain.prompts}
            promptCache={promptCache}
            project={project}
          />
        )
      case 'test':
        return chainIsLoaded ? (
          <TestChainTab
            items={items}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            promptCache={promptCache}
          />
        ) : null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
