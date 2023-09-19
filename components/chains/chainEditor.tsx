import { useState } from 'react'
import { ActiveChain, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode } from './chainNode'
import ChainEditorHeader from './chainEditorHeader'
import SegmentedControl, { Segment } from '../segmentedControl'
import { ChainNodeBox } from './chainNodeBox'
import { PromptCache } from '@/src/client/hooks/usePromptCache'

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
  promptCache: PromptCache
}) {
  const [activeMenuIndex, setActiveMenuIndex] = useState<number>()

  if (nodes.length === 2 && !activeMenuIndex) {
    setActiveMenuIndex(1)
  }

  const removeItem = (index: number) => setNodes([...nodes.slice(0, index), ...nodes.slice(index + 1)])
  const insertItem = (index: number, item: ChainItem) => {
    setNodes([...nodes.slice(0, index), item, ...nodes.slice(index)])
    setActiveIndex(index)
  }
  const insertPrompt = (index: number, promptID: number, versionID?: number) =>
    insertItem(index, {
      promptID,
      versionID: versionID ?? prompts.find(prompt => prompt.id === promptID)!.lastVersionID,
    })
  const insertCodeBlock = (index: number) => insertItem(index, { code: '' })

  const onSelect = (index: number) => {
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
        {nodes.map((node, index) => (
          <ChainNodeBox
            key={index}
            chain={chain}
            savedVersion={saveItems ? null : activeVersion}
            chainNode={node}
            itemIndex={index}
            isFirst={index === 0}
            isSelected={index === activeIndex}
            onSelect={() => onSelect(index)}
            isMenuActive={index === activeMenuIndex}
            setMenuActive={active => setActiveMenuIndex(active ? index : undefined)}
            onDelete={() => removeItem(index)}
            onInsertPrompt={promptID => insertPrompt(index, promptID)}
            onInsertNewPrompt={() =>
              addPrompt().then(({ promptID, versionID }) => insertPrompt(index, promptID, versionID))
            }
            onInsertCodeBlock={() => insertCodeBlock(index)}
            prompts={prompts}
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
