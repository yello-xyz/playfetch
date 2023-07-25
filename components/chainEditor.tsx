import { ChainItem, Prompt } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import Button from './button'

export default function ChainEditor({
  nodes,
  setNodes,
  activeIndex,
  setActiveIndex,
  prompts,
}: {
  nodes: ChainNode[]
  setNodes: (nodes: ChainNode[]) => void
  activeIndex: number
  setActiveIndex: (index: number) => void
  prompts: Prompt[]
}) {
  const removeItem = () => setNodes([...nodes.slice(0, activeIndex), ...nodes.slice(activeIndex + 1)])
  const insertItem = (item: ChainItem) => setNodes([...nodes.slice(0, activeIndex), item, ...nodes.slice(activeIndex)])
  const insertPrompt = () => insertItem({ promptID: prompts[0].id, versionID: prompts[0].lastVersionID })

  const insertCodeBlock = () => {
    const code = `'Hello world'`
    insertItem({ code })
  }

  return (
    <div className='flex flex-col items-center justify-between'>
      <div className='flex flex-col items-center h-full p-8 pr-0 overflow-y-auto'>
        {nodes.map((node, index) => (
          <ChainNodeBox
            key={index}
            chainNode={node}
            isFirst={index === 0}
            isActive={index === activeIndex}
            callback={() => setActiveIndex(index)}
            prompts={prompts}
          />
        ))}
      </div>
      <div className='flex gap-4 p-6'>
        {activeIndex > 0 && (
          <>
            {activeIndex !== nodes.length - 1 && (
              <Button type='destructive' onClick={removeItem}>
                Remove Node
              </Button>
            )}
            {prompts.length > 0 && (
              <Button type='outline' onClick={insertPrompt}>
                Insert Prompt
              </Button>
            )}
            <Button type='outline' onClick={insertCodeBlock}>
              Insert Code Block
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function ChainNodeBox({
  chainNode,
  isFirst,
  isActive,
  callback,
  prompts,
}: {
  chainNode: ChainNode
  isFirst: boolean
  isActive: boolean
  callback: () => void
  prompts: Prompt[]
}) {
  const colorClass = isActive ? 'bg-blue-25 border-blue-50' : 'border-gray-300'
  return (
    <>
      {!isFirst && <div className='w-px h-4 border-l border-gray-300 min-h-[16px]' />}
      <div className={`text-center border px-4 py-2 rounded-lg cursor-pointer ${colorClass}`} onClick={callback}>
        {chainNode === InputNode && 'Input'}
        {chainNode === OutputNode && 'Output'}
        {IsPromptChainItem(chainNode) && prompts.find(prompt => prompt.id === chainNode.promptID)?.name}
        {IsCodeChainItem(chainNode) && 'Code block'}
      </div>
    </>
  )
}
