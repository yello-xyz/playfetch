import { useState } from 'react'
import { ActiveChain, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, NameForCodeChainItem, OutputNode } from './chainNode'
import DropdownMenu from './dropdownMenu'
import ChainEditorHeader from './chainEditorHeader'
import { HeaderItem } from './tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from './icon'
import ChainNodePopupMenu from './chainNodePopupMenu'
import addIcon from '@/public/addSmall.svg'
import addActiveIcon from '@/public/addWhiteSmall.svg'
import { StaticImageData } from 'next/image'

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
  const [activeMenuIndex, setActiveMenuIndex] = useState<number>()

  const removeItem = (index: number) => setNodes([...nodes.slice(0, index), ...nodes.slice(index + 1)])
  const insertItem = (index: number, item: ChainItem) =>
    setNodes([...nodes.slice(0, index), item, ...nodes.slice(index)])
  const insertPrompt = (index: number, promptID: number) =>
    insertItem(index, { promptID, versionID: prompts.find(prompt => prompt.id === promptID)!.lastVersionID })
  const insertCodeBlock = (index: number) => insertItem(index, { code: '' })

  const onSelect = (index: number) => {
    setActiveIndex(index)
    setActiveMenuIndex(undefined)
  }

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
            onSelect={() => onSelect(index)}
            isMenuActive={index === activeMenuIndex}
            setMenuActive={active => setActiveMenuIndex(active ? index : undefined)}
            onDelete={() => removeItem(index)}
            onInsertCodeBlock={() => insertCodeBlock(index)}
            prompts={prompts}
          />
        ))}
      </div>
      <div className='flex self-start gap-4 p-4'>
        {activeIndex > 0 && prompts.length > 0 && (
          <PromptSelector
            prompts={prompts}
            insertPrompt={prompt => insertPrompt(activeIndex, prompt)}
            insertCodeBlock={() => insertCodeBlock(activeIndex)}
          />
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
  isMenuActive,
  setMenuActive,
  onInsertCodeBlock,
  onDelete,
  prompts,
}: {
  chainNode: ChainNode
  isFirst: boolean
  isSelected: boolean
  onSelect: () => void
  isMenuActive: boolean
  setMenuActive: (active: boolean) => void
  onInsertCodeBlock: () => void
  onDelete: () => void
  prompts: Prompt[]
}) {
  const colorClass = isSelected ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-400'
  const icon = IsPromptChainItem(chainNode) ? promptIcon : IsCodeChainItem(chainNode) ? codeIcon : undefined
  return (
    <>
      {!isFirst && (
        <>
          <SmallDot margin='-mt-[5px] mb-0.5' />
          <DownStroke height='min-h-[12px]' />
          <AddButton isActive={isMenuActive} setActive={setMenuActive} onInsertCodeBlock={onInsertCodeBlock} />
          <DownArrow height='min-h-[18px]' />
          <SmallDot margin='-mb-[5px] mt-1' />
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

const SmallDot = ({ margin, color = 'bg-white border border-gray-400' }: { margin: string; color?: string }) => (
  <div className={`${margin} ${color} z-10 w-2.5 h-2.5 rounded-full min-h-[10px]`} />
)

const DownStroke = ({ height = 'h-full', color = 'border-gray-400' }: { height?: string; color?: string }) => (
  <div className={`${height} w-px h-4 border-l ${color}`} />
)

const DownArrow = ({ height }: { height: string }) => (
  <>
    <DownStroke height={height} />
    <div className='p-1 mb-px -mt-2.5 rotate-45 border-b border-r border-gray-400' />
  </>
)

const AddButton = ({
  isActive,
  setActive,
  onInsertCodeBlock,
}: {
  isActive: boolean
  setActive: (active: boolean) => void
  onInsertCodeBlock: () => void
}) => {
  const [isHovered, setHovered] = useState(false)
  const hoverClass = isHovered ? 'bg-blue-200' : 'border border-gray-400'

  const toggleActive = (callback?: () => void) => () => {
    setActive(!isActive)
    setHovered(false)
    console.log(callback)
    callback?.()
  }

  return isActive ? (
    <>
      <DownArrow height='min-h-[38px]' />
      <SmallDot margin='-mb-[5px] mt-1' color='bg-blue-200' />
      <div className='flex p-1 border border-blue-100 border-dashed rounded-lg w-96 bg-blue-25'>
        <AddStepButton label='Add prompt' icon={promptIcon} onClick={() => {}} />
        <DownStroke color='border-blue-100' />
        <AddStepButton label='Add code block' icon={codeIcon} onClick={toggleActive(onInsertCodeBlock)} />
      </div>
      <SmallDot margin='-mt-[5px] mb-0.5' color='bg-blue-200' />
      <DownStroke height='min-h-[32px]' />
    </>
  ) : (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={toggleActive()}>
      <Icon className={`${hoverClass} my-0.5 rounded-full cursor-pointer`} icon={isHovered ? addActiveIcon : addIcon} />
    </div>
  )
}

const AddStepButton = ({ label, icon, onClick }: { label: string; icon: StaticImageData; onClick: () => void }) => {
  return (
    <div
      className='flex items-center justify-center w-1/2 gap-1 p-2 rounded cursor-pointer hover:bg-blue-50'
      onClick={onClick}>
      <Icon icon={icon} />
      {label}
    </div>
  )
}
