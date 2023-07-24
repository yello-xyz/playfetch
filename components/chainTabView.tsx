import {
  ActiveProject,
  ActivePrompt,
  Chain,
  ChainItem,
  CodeConfig,
  PartialRun,
  PromptInputs,
  RunConfig,
  Version,
} from '@/types'
import BuildChainTab, { ExtractUnboundChainVariables } from './buildChainTab'
import { useEffect, useState } from 'react'
import TestChainTab from './testChainTab'
import { ConsumeRunStreamReader } from './promptTabView'
import useInputValues from './inputValues'
import api from '@/src/client/api'
import useCheckProvider from './checkProvider'
import RunTimeline from './runTimeline'
import TabSelector, { TabButton } from './tabSelector'
import { toActivePrompt } from '@/pages/[projectID]'

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

type ActiveTab = 'buildchain' | 'testdata'

export default function ChainTabView({
  chain,
  project,
  onRefresh,
}: {
  chain: Chain
  project: ActiveProject
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('buildchain')

  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    project.inputValues,
    project.id,
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
      api.getPromptVersions(unloadedItem.promptID).then(versions => {
        const prompt = toActivePrompt(unloadedItem.promptID, versions, project)
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
  }, [project, items, setItems, activePromptCache])

  const chainIsLoaded = items.every(item => !IsPromptChainItem(item) || promptCache.promptForItem(item))

  const inputs = ExtractUnboundChainVariables(items, promptCache)
  const strippedItems = items.map(item =>
    IsPromptChainItem(item) ? { promptID: item.promptID, ...ChainItemToConfig(item) } : item
  )
  const itemsKey = JSON.stringify(strippedItems)
  const [savedItemsKey, setSavedItemsKey] = useState(itemsKey)
  if (chainIsLoaded && itemsKey !== savedItemsKey) {
    setSavedItemsKey(itemsKey)
    api.updateChain(chain.id, strippedItems, inputs).then(onRefresh)
  }

  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [isRunning, setRunning] = useState(false)

  const checkProviderAvailable = useCheckProvider()

  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    const versions = items.filter(IsPromptChainItem).map(item => promptCache.versionForItem(item))
    if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
      setRunning(true)
      if (items.length > 0) {
        const streamReader = await api.runChain(items.map(ChainItemToConfig), inputs)
        await ConsumeRunStreamReader(streamReader, setPartialRuns)
      }
      setRunning(false)
    }
  }

  const tabSelector = (
    <TabSelector>
      <TabButton title='Build chain' tab='buildchain' activeTab={activeTab} setActiveTab={setActiveTab} />
      <TabButton title='Test data' tab='testdata' activeTab={activeTab} setActiveTab={setActiveTab} />
    </TabSelector>
  )

  const renderTab = () => {
    switch (activeTab) {
      case 'buildchain':
        return (
          <BuildChainTab
            items={items}
            setItems={setItems}
            prompts={project.prompts}
            promptCache={promptCache}
            project={project}
            inputValues={inputValues}
            runChain={runChain}
            tabSelector={tabSelector}
          />
        )
      case 'testdata':
        return chainIsLoaded ? (
          <TestChainTab
            items={items}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            promptCache={promptCache}
            runChain={runChain}
            tabSelector={tabSelector}
          />
        ) : null
    }
  }

  return (
    <div className='flex items-stretch h-full'>
      {renderTab()}
      <div className='flex-1 p-6 pl-0 min-w-[30%]'>
        <RunTimeline runs={partialRuns} isRunning={isRunning} />
      </div>
    </div>
  )
}
