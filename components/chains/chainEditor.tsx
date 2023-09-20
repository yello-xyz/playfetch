import { ActiveChain, ChainVersion, Prompt } from '@/types'
import { ChainNode } from './chainNode'
import ChainEditorHeader from './chainEditorHeader'
import SegmentedControl, { Segment } from '../segmentedControl'
import { ChainNodeBox } from './chainNodeBox'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'

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
            setActiveIndex={setActiveIndex}
            savedVersion={saveItems ? null : activeVersion}
            isTestMode={isTestMode}
            setTestMode={setTestMode}
            prompts={prompts}
            addPrompt={addPrompt}
            promptCache={promptCache}
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
