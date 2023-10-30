import { ActiveChain, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode } from './chainNode'
import ChainEditorHeader from './chainEditorHeader'
import SegmentedControl, { Segment } from '../segmentedControl'
import { ChainNodeBox } from './chainNodeBox'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import { Fragment, useState } from 'react'
import { useCheckProviders } from '@/src/client/hooks/useAvailableProviders'
import { EmbeddingModels, QueryProviders } from '@/src/common/providerMetadata'
import { SplitNodes } from '@/src/common/branching'

export default function ChainEditor({
  chain,
  activeVersion,
  isVersionSaved,
  nodes,
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
  isVersionSaved: boolean
  nodes: ChainNode[]
  saveItems: (items: ChainItem[]) => void
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
  const provider = QueryProviders.find(provider => checkProviderAvailable(provider))
  const model = EmbeddingModels.find(model => checkModelAvailable(model))
  const defaultQueryConfig = provider && model ? { provider, model, indexName: '', query: '', topK: 1 } : undefined

  const [activeMenuIndex, setActiveMenuIndex] = useState<number>()

  if (nodes.length === 2 && !activeMenuIndex) {
    setActiveMenuIndex(1)
  }

  const updateActiveIndex = (index: number) => {
    setActiveIndex(index)
    setActiveMenuIndex(undefined)
  }

  const tinyLabelClass = 'text-white px-2 py-px text-[11px] font-medium'

  const items = nodes.slice(1, -1) as ChainItem[]
  const itemRows = [[nodes[0]], ...SplitNodes(items), [nodes.slice(-1)[0]]]
  const maxBranch = Math.max(0, ...items.map(item => item.branch))
  const gridConfig = gridConfigs[Math.min(maxBranch, gridConfigs.length - 1)]

  return (
    <div className='relative flex flex-col items-stretch h-full bg-gray-25'>
      <ChainEditorHeader
        chain={chain}
        activeVersion={activeVersion}
        isVersionSaved={isVersionSaved}
        showVersions={showVersions}
        setShowVersions={setShowVersions}
      />
      <div className='flex flex-col h-full bg-local bg-[url("/dotPattern.png")] bg-[length:18px_18px] overflow-auto'>
        <div className={`relative p-8 pr-0 grid ${gridConfig} mt-auto mb-auto justify-items-center`}>
          <div className={`${tinyLabelClass} bg-green-300 rounded-t mr-80`}>Start</div>
          {itemRows.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              {row.map((node, columnIndex) => (
                <ChainNodeBox
                  key={columnIndex}
                  chain={chain}
                  index={nodes.indexOf(node)}
                  nodes={nodes}
                  saveItems={saveItems}
                  activeIndex={activeIndex}
                  setActiveIndex={updateActiveIndex}
                  isMenuActive={nodes.indexOf(node) === activeMenuIndex}
                  setMenuActive={active => setActiveMenuIndex(active ? nodes.indexOf(node) : undefined)}
                  savedVersion={isVersionSaved ? activeVersion : null}
                  isTestMode={isTestMode}
                  setTestMode={setTestMode}
                  prompts={prompts}
                  addPrompt={addPrompt}
                  promptCache={promptCache}
                  defaultQueryConfig={defaultQueryConfig}
                />
              ))}
            </Fragment>
          ))}
          <div className={`${tinyLabelClass} bg-red-300 rounded-b ml-80`}>End</div>
        </div>
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

const gridConfigs = [
  'grid-cols-[repeat(1,minmax(0,1fr))]',
  'grid-cols-[repeat(2,minmax(0,1fr))]',
  'grid-cols-[repeat(3,minmax(0,1fr))]',
  'grid-cols-[repeat(4,minmax(0,1fr))]',
  'grid-cols-[repeat(5,minmax(0,1fr))]',
  'grid-cols-[repeat(6,minmax(0,1fr))]',
  'grid-cols-[repeat(7,minmax(0,1fr))]',
  'grid-cols-[repeat(8,minmax(0,1fr))]',
  'grid-cols-[repeat(9,minmax(0,1fr))]',
  'grid-cols-[repeat(10,minmax(0,1fr))]',
  'grid-cols-[repeat(11,minmax(0,1fr))]',
  'grid-cols-[repeat(12,minmax(0,1fr))]',
  'grid-cols-[repeat(13,minmax(0,1fr))]',
  'grid-cols-[repeat(14,minmax(0,1fr))]',
  'grid-cols-[repeat(15,minmax(0,1fr))]',
  'grid-cols-[repeat(16,minmax(0,1fr))]',
  'grid-cols-[repeat(17,minmax(0,1fr))]',
  'grid-cols-[repeat(18,minmax(0,1fr))]',
  'grid-cols-[repeat(19,minmax(0,1fr))]',
  'grid-cols-[repeat(20,minmax(0,1fr))]',
]
