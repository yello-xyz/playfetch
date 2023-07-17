import { ActiveChain, ActivePrompt, ChainItem, Version } from '@/types'
import BuildChainTab from './buildChainTab'
import { useEffect, useState } from 'react'
import TestChainTab from './testChainTab'
import { MainViewTab } from './promptTabView'
import useInputValues from './inputValues'
import PublishChainTab from './publishChainTab'
import api from '@/src/client/api'

export type LoadedChainItem = ChainItem & { prompt: ActivePrompt; version: Version }
export const IsLoadedChainItem = (item: ChainItem): item is LoadedChainItem =>
  'version' in item && item.version !== undefined
export const AsLoadedChainItem = (item: ChainItem): LoadedChainItem | undefined =>
  IsLoadedChainItem(item) ? item : undefined

export default function ChainTabView({ activeTab, chain }: { activeTab: MainViewTab; chain: ActiveChain }) {
  const [items, setItems] = useState(chain.items)

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    chain.inputs,
    chain.projectID,
    activeTab
  )

  const [activePromptCache, setActivePromptCache] = useState<{ [promptID: number]: ActivePrompt }>({})

  useEffect(() => {
    const unloadedItem = items.find(item => !IsLoadedChainItem(item))
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
  }, [items, setItems])

  const chainIsLoaded = items.every(IsLoadedChainItem)

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
          <BuildChainTab
            items={items}
            setItems={setItems}
            prompts={chain.prompts}
            activePromptCache={activePromptCache}
          />
        )
      case 'test':
        return chainIsLoaded ? (
          <TestChainTab
            items={items}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
          />
        ) : null
      case 'publish':
        return chainIsLoaded ? <PublishChainTab items={items} chain={chain} /> : null
    }
  }

  return <div className='flex items-stretch h-full'>{renderTab()}</div>
}
