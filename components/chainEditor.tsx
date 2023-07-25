import { ChainItem, Prompt } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import Button from './button'
import DropdownMenu from './dropdownMenu'

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
  const insertPrompt = (promptID: number) =>
    insertItem({ promptID, versionID: prompts.find(prompt => prompt.id === promptID)!.lastVersionID })

  const insertCodeBlock = () => {
    const code = `'Hello world'`
    insertItem({ code })
  }

  return (
    <div className='flex flex-col items-center justify-between min-w-[500px]'>
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
      <div className='flex self-start gap-4 p-6'>
        {activeIndex > 0 && (
          <>
            {prompts.length > 0 && <PromptSelector prompts={prompts} onSelectPrompt={insertPrompt} />}
            <Button type='outline' onClick={insertCodeBlock}>
              Insert Code
            </Button>
            {activeIndex !== nodes.length - 1 && (
              <Button type='destructive' onClick={removeItem}>
                Remove Node
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PromptSelector({
  prompts,
  onSelectPrompt,
}: {
  prompts: Prompt[]
  onSelectPrompt: (promptID: number) => void
}) {
  return (
    <DropdownMenu value={0} onChange={value => onSelectPrompt(Number(value))}>
      <option value={0} disabled>
        Insert Prompt
      </option>
      {prompts.map((prompt, index) => (
        <option key={index} value={prompt.id}>
          {prompt.name}
        </option>
      ))}
    </DropdownMenu>
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
