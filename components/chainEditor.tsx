import { ActiveChain, ActiveProject, ChainItem, ChainVersion, Prompt } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, OutputNode } from './chainNode'
import Button from './button'
import DropdownMenu from './dropdownMenu'
import { CustomHeader } from './tabSelector'
import Icon from './icon'
import chainIcon from '@/public/chain.svg'
import saveIcon from '@/public/save.svg'
import historyIcon from '@/public/history.svg'
import { ReactNode } from 'react'
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
  const removeItem = () => setNodes([...nodes.slice(0, activeIndex), ...nodes.slice(activeIndex + 1)])
  const insertItem = (item: ChainItem) => setNodes([...nodes.slice(0, activeIndex), item, ...nodes.slice(activeIndex)])
  const insertPrompt = (promptID: number) =>
    insertItem({ promptID, versionID: prompts.find(prompt => prompt.id === promptID)!.lastVersionID })
  const insertCodeBlock = () => insertItem({ code: '' })

  const versionIndex = chain.versions.findIndex(version => version.id === activeVersion.id)

  return (
    <div className='flex flex-col items-stretch justify-between h-full bg-gray-25'>
      <CustomHeader>
        <ShowVersionsButton showVersions={showVersions} setShowVersions={setShowVersions} />
        <HeaderTitle chainName={chain.name} versionIndex={saveItems || !setShowVersions ? undefined : versionIndex} />
        <SaveVersionButton saveItems={saveItems} />
      </CustomHeader>
      <div className='flex flex-col items-center w-full p-8 pr-0 overflow-y-auto'>
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
            {prompts.length > 0 && (
              <PromptSelector prompts={prompts} insertPrompt={insertPrompt} insertCodeBlock={insertCodeBlock} />
            )}
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

function HeaderTitle({ chainName, versionIndex }: { chainName: string; versionIndex?: number }) {
  return (
    <div className='flex flex-wrap items-center justify-center h-full gap-2 overflow-hidden shrink-0 max-h-11'>
      <div className='flex items-center h-full font-medium select-none whitespace-nowrap'>
        <Icon icon={chainIcon} className='h-full py-2.5' />
        {chainName}
      </div>
      {versionIndex === undefined ? (
        <span className='px-2 py-1 text-gray-400 rounded bg-gray-50'>Unsaved</span>
      ) : (
        <span className='text-gray-400 whitespace-nowrap'>Version {versionIndex + 1}</span>
      )}
    </div>
  )
}

const ShowVersionsButton = ({
  showVersions,
  setShowVersions,
}: {
  showVersions: boolean
  setShowVersions?: (show: boolean) => void
}) => (
  <HeaderButton
    onClick={setShowVersions ? () => setShowVersions(!showVersions) : undefined}
    title={showVersions ? 'Hide versions' : 'Show versions'}
    icon={historyIcon}
    justify='justify-start'
    hideIfInactive
  />
)

const SaveVersionButton = ({ saveItems }: { saveItems?: () => void }) => (
  <HeaderButton onClick={saveItems} title='Save version' icon={saveIcon} justify='justify-end' />
)

function HeaderButton({
  title,
  icon,
  justify,
  onClick,
  hideIfInactive,
}: {
  title: string
  icon: StaticImageData
  justify: 'justify-start' | 'justify-end' | 'justify-center'
  onClick?: () => void
  hideIfInactive?: boolean
}) {
  const activeClass = onClick ? 'cursor-pointer hover:bg-gray-50' : hideIfInactive ? 'opacity-0' : 'opacity-50'
  return (
    <div className={`rounded-md max-h-7 py-1 overflow-hidden ${activeClass}`} onClick={onClick}>
      <div className={`flex flex-wrap items-center -mt-0.5 px-1.5 ${justify}`}>
        <Icon icon={icon} className='h-full' />
        <span className='whitespace-nowrap'>{title}</span>
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
  const colorClass = isActive ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-400'
  return (
    <>
      {!isFirst && (
        <>
          <div className='w-px h-4 border-l border-gray-400 min-h-[32px]' />
          <div className='p-0.5 mb-px -mt-1.5 rotate-45 border-b border-r border-gray-400' />
        </>
      )}
      <div className={`text-center border px-4 py-2 rounded-lg cursor-pointer ${colorClass}`} onClick={callback}>
        {chainNode === InputNode && 'Input'}
        {chainNode === OutputNode && 'Output'}
        {IsPromptChainItem(chainNode) && prompts.find(prompt => prompt.id === chainNode.promptID)?.name}
        {IsCodeChainItem(chainNode) && 'Code block'}
      </div>
    </>
  )
}
