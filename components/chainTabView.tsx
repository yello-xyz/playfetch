import { ActiveChain, ActivePrompt, ChainItem, Version } from '@/types'
import BuildChainTab from './buildChainTab'
import { useEffect, useState } from 'react'
import TestChainTab from './testChainTab'
import { MainViewTab } from './promptTabView'
import useInputValues from './inputValues'
import PublishChainTab from './publishChainTab'
import api from '@/src/client/api'

export type ActivePromptCache = {
  promptForID: (id: number) => ActivePrompt | undefined
  promptForItem: (item: ChainItem) => ActivePrompt | undefined
  versionForItem: (item: ChainItem) => Version | undefined
}

export default function ChainTabView({ activeTab, chain }: { activeTab: MainViewTab; chain: ActiveChain }) {
  const [items, setItems] = useState(chain.items)

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    chain.inputs,
    chain.projectID,
    activeTab
  )

  const [activePromptCache, setActivePromptCache] = useState<Record<number, ActivePrompt>>({})
  const promptCache: ActivePromptCache = {
    promptForID: id => activePromptCache[id],
    promptForItem: item => activePromptCache[item.promptID],
    versionForItem: item => activePromptCache[item.promptID]?.versions.find(version => version.id === item.versionID),
  }

  useEffect(() => {
    const unloadedItem = items.find(item => !activePromptCache[item.promptID])
    if (unloadedItem) {
      api.getPrompt(unloadedItem.promptID).then(prompt => {
        setActivePromptCache(cache => ({ ...cache, [prompt.id]: prompt }))
        setItems(
          items.map(item =>
            item.promptID === prompt.id
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

  const chainIsLoaded = items.every(item => promptCache.promptForItem(item))

  const rawItems = items.map(item => ({
    promptID: item.promptID,
    versionID: item.versionID,
    output: item.output,
    includeContext: item.includeContext,
  }))
  const itemsKey = JSON.stringify(rawItems)
  const [savedItemsKey, setSavedItemsKey] = useState(itemsKey)
  if (itemsKey !== savedItemsKey) {
    setSavedItemsKey(itemsKey)
    api.updateChain(chain.id, rawItems)
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'play':
        return (
          <BuildChainTab items={items} setItems={setItems} prompts={chain.prompts} promptCache={promptCache} />
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
      case 'publish':
        return chainIsLoaded ? <PublishChainTab items={items} chain={chain} promptCache={promptCache} /> : null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
