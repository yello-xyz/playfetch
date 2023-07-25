import { Prompt } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, OutputNode } from './chainNode'

export default function ChainEditor({
  nodes,
  activeIndex,
  setActiveIndex,
  prompts,
}: {
  nodes: ChainNode[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  prompts: Prompt[]
}) {
  return (
    <div className='flex flex-col items-center w-1/3 h-full p-8 pr-0 overflow-y-auto'>
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
