import { ActiveChain, ChainVersion, Prompt, QueryConfig } from '@/types'
import { ChainNode } from './chainNode'
import ChainEditorHeader from './chainEditorHeader'
import SegmentedControl, { Segment } from '../segmentedControl'
import { ChainNodeBox } from './chainNodeBox'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import { useState } from 'react'
import { useCheckProviders } from '@/src/client/hooks/useAvailableProviders'
import { AllEmbeddingModels, AllQueryProviders, ProviderForModel } from '@/src/common/providerMetadata'

export default function ChainEditor({
  chain,
  activeVersion,
  nodes,
  setNodes,
  saveItems,
  activeIndex,
  setActiveIndex,
  prompts,
  addPrompt,
  showVersions,
  setShowVersions,
  isTestMode,
  setTestMode,
  disabled,
  promptCache,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  nodes: ChainNode[]
  setNodes: (nodes: ChainNode[]) => void
  saveItems?: () => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  prompts: Prompt[]
  addPrompt: () => Promise<{ promptID: number; versionID: number }>
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
  isTestMode: boolean
  setTestMode: (testMode: boolean) => void
  disabled: boolean
  promptCache: ChainPromptCache
}) {
  const [checkProviderAvailable, checkModelAvailable] = useCheckProviders()
  const provider = AllQueryProviders.find(provider => checkProviderAvailable(provider))
  const model = AllEmbeddingModels.find(model => checkModelAvailable(model))
  const defaultQueryConfig = provider && model ? { provider, model, indexName: '', query: '' } : undefined

  const [activeMenuIndex, setActiveMenuIndex] = useState<number>()

  if (nodes.length === 2 && !activeMenuIndex) {
    setActiveMenuIndex(1)
  }

  const updateActiveIndex = (index: number) => {
    setActiveIndex(index)
    setActiveMenuIndex(undefined)
  }

  const tinyLabelClass = 'text-white px-2 py-px text-[11px] font-medium'

  return (
    <div className='relative flex flex-col items-stretch h-full bg-gray-25'>
      <ChainEditorHeader
        chain={chain}
        activeVersion={activeVersion}
        saveItems={saveItems}
        showVersions={showVersions}
        setShowVersions={setShowVersions}
      />
      <div className='relative flex flex-col items-center w-full h-full p-8 pr-0 overflow-y-auto'>
        <div className={`${tinyLabelClass} bg-green-300 rounded-t mr-80 mt-auto`}>Start</div>
        {nodes.map((_, index, nodes) => (
          <ChainNodeBox
            key={index}
            chain={chain}
            index={index}
            nodes={nodes}
            setNodes={setNodes}
            activeIndex={activeIndex}
            setActiveIndex={updateActiveIndex}
            isMenuActive={index === activeMenuIndex}
            setMenuActive={active => setActiveMenuIndex(active ? index : undefined)}
            savedVersion={saveItems ? null : activeVersion}
            isTestMode={isTestMode}
            setTestMode={setTestMode}
            prompts={prompts}
            addPrompt={addPrompt}
            promptCache={promptCache}
            defaultQueryConfig={defaultQueryConfig}
          />
        ))}
        <div className={`${tinyLabelClass} bg-red-300 rounded-b ml-80 mb-auto`}>End</div>
      </div>
      <SegmentedControl
        className='absolute z-30 bottom-4 right-4'
        selected={isTestMode}
        callback={setTestMode}
        disabled={disabled}>
        <Segment title='Edit' value={false} />
        <Segment title='Test' value={true} />
      </SegmentedControl>
      {disabled && <div className='absolute inset-0 z-30 w-full h-full bg-gray-300 opacity-20' />}
    </div>
  )
}
