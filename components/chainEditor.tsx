import { ActiveChain, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, NameForCodeChainItem, OutputNode } from './chainNode'
import Button from './button'
import DropdownMenu from './dropdownMenu'
import ChainEditorHeader from './chainEditorHeader'
import { HeaderItem } from './tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from './icon'
import ChainNodePopupMenu from './chainNodePopupMenu'

export default function ChainEditor({
  chain,
  activeVersion,
  nodes,
  setNodes,
  saveItems,
  activeIndex,
  setActiveIndex,
  prompts,
  showVersions,
  setShowVersions,
}: {
  chain: ActiveChain
  activeVersion: ChainVersion
  nodes: ChainNode[]
  setNodes: (nodes: ChainNode[]) => void
  saveItems?: () => void
  activeIndex: number
  setActiveIndex: (index: number) => void
  prompts: Prompt[]
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
}) {
  const removeItem = (index: number) => setNodes([...nodes.slice(0, index), ...nodes.slice(index + 1)])
  const insertItem = (item: ChainItem) => setNodes([...nodes.slice(0, activeIndex), item, ...nodes.slice(activeIndex)])
  const insertPrompt = (promptID: number) =>
    insertItem({ promptID, versionID: prompts.find(prompt => prompt.id === promptID)!.lastVersionID })
  const insertCodeBlock = () => insertItem({ code: '' })

  return (
    <div className='flex flex-col items-stretch justify-between h-full bg-gray-25'>
      <ChainEditorHeader
        chain={chain}
        activeVersion={activeVersion}
        saveItems={saveItems}
        showVersions={showVersions}
        setShowVersions={setShowVersions}
      />
      <div className='flex flex-col items-center w-full p-8 pr-0 overflow-y-auto'>
        {nodes.map((node, index) => (
          <ChainNodeBox
            key={index}
            chainNode={node}
            isFirst={index === 0}
            isSelected={index === activeIndex}
            onSelect={() => setActiveIndex(index)}
            onDelete={() => removeItem(index)}
            prompts={prompts}
          />
        ))}
      </div>
      <div className='flex self-start gap-4 p-4'>
        {activeIndex > 0 && prompts.length > 0 && (
          <PromptSelector prompts={prompts} insertPrompt={insertPrompt} insertCodeBlock={insertCodeBlock} />
        )}
      </div>
    </div>
  )
}

function PromptSelector({
  prompts,
  insertPrompt,
  insertCodeBlock,
}: {
  prompts: Prompt[]
  insertPrompt: (promptID: number) => void
  insertCodeBlock: () => void
}) {
  const CODE_BLOCK = 1

  return (
    <DropdownMenu
      value={0}
      onChange={value => (Number(value) === CODE_BLOCK ? insertCodeBlock() : insertPrompt(Number(value)))}>
      <option value={0} disabled>
        Insert Node
      </option>
      <option value={CODE_BLOCK}>Code Block</option>
      {prompts.map((prompt, index) => (
        <option key={index} value={prompt.id}>
          Prompt “{prompt.name}”
        </option>
      ))}
    </DropdownMenu>
  )
}

function ChainNodeBox({
  chainNode,
  isFirst,
  isSelected,
  onSelect,
  onDelete,
  prompts,
}: {
  chainNode: ChainNode
  isFirst: boolean
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  prompts: Prompt[]
}) {
  const colorClass = isSelected ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-400'
  const icon = IsPromptChainItem(chainNode) ? promptIcon : IsCodeChainItem(chainNode) ? codeIcon : undefined
  return (
    <>
      {!isFirst && (
        <>
          <div className='w-px h-4 border-l border-gray-400 min-h-[32px]' />
          <div className='p-0.5 mb-px -mt-1.5 rotate-45 border-b border-r border-gray-400' />
        </>
      )}
      <div
        className={`flex items-center justify-between border px-2 w-96 rounded-lg cursor-pointer ${colorClass}`}
        onClick={onSelect}>
        <HeaderItem>
          {icon && <Icon className='mr-0.5 -ml-2' icon={promptIcon} />}
          {chainNode === InputNode && 'Input'}
          {chainNode === OutputNode && 'Output'}
          {IsPromptChainItem(chainNode) && <>{prompts.find(prompt => prompt.id === chainNode.promptID)?.name}</>}
          {IsCodeChainItem(chainNode) && <>{NameForCodeChainItem(chainNode)}</>}
        </HeaderItem>
        {(IsPromptChainItem(chainNode) || IsCodeChainItem(chainNode)) && (
          <ChainNodePopupMenu onDelete={onDelete} selected={isSelected} />
        )}
      </div>
    </>
  )
}
