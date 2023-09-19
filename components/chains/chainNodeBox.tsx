import { ActiveChain, ChainVersion, Prompt, PromptChainItem } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, NameForCodeChainItem, OutputNode } from './chainNode'
import { EditableHeaderItem, HeaderItem, SingleTabHeader } from '../tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from '../icon'
import ChainNodePopupMenu from './chainNodePopupMenu'
import CommentPopupMenu from '../commentPopupMenu'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import { LabelForModel } from '../prompts/modelSelector'
import { VersionLabels } from '../versions/versionCell'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { ChainNodeBoxConnector } from './chainNodeBoxConnector'
import { TaggedVersionPrompt } from '../versions/versionComparison'
import { useState } from 'react'

export function ChainNodeBox({
  chain,
  savedVersion,
  chainNode,
  itemIndex,
  isFirst,
  isSelected,
  isTestMode,
  setTestMode,
  onSelect,
  isMenuActive,
  setMenuActive,
  onInsertPrompt,
  onInsertNewPrompt,
  onInsertCodeBlock,
  onRenameCodeChainItem,
  onDelete,
  prompts,
  promptCache,
}: {
  chain: ActiveChain
  savedVersion: ChainVersion | null
  chainNode: ChainNode
  itemIndex: number
  isFirst: boolean
  isSelected: boolean
  isTestMode: boolean
  setTestMode: (testMode: boolean) => void
  onSelect: () => void
  isMenuActive: boolean
  setMenuActive: (active: boolean) => void
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertCodeBlock: () => void
  onRenameCodeChainItem: (name: string) => void
  onDelete: () => void
  prompts: Prompt[]
  promptCache: PromptCache
}) {
  const colorClass = isSelected ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-200'
  const icon = IsPromptChainItem(chainNode) ? promptIcon : IsCodeChainItem(chainNode) ? codeIcon : undefined

  const onEdit = () => {
    setTestMode(false)
    onSelect()
  }

  const [label, setLabel] = useState<string>()
  const onRename = IsCodeChainItem(chainNode) ? () => setLabel(NameForCodeChainItem(chainNode)) : undefined
  const submitRename = (name: string) => {
    onRenameCodeChainItem(name)
    setLabel(undefined)
  }

  return (
    <>
      {!isFirst && (
        <ChainNodeBoxConnector
          prompts={prompts}
          isDisabled={isTestMode}
          isActive={isMenuActive}
          setActive={setMenuActive}
          onInsertPrompt={onInsertPrompt}
          onInsertNewPrompt={onInsertNewPrompt}
          onInsertCodeBlock={onInsertCodeBlock}
        />
      )}
      <div className={`flex flex-col border w-96 rounded-lg cursor-pointer ${colorClass}`} onClick={onSelect}>
        <div className={`flex items-center justify-between px-2 rounded-t-lg`}>
          {label !== undefined ? (
            <EditableHeaderItem value={label} onChange={setLabel} onSubmit={() => submitRename(label)} />
          ) : (
            <HeaderItem>
              {icon && <Icon className='mr-0.5 -ml-2' icon={icon} />}
              {chainNode === InputNode && 'Inputs'}
              {chainNode === OutputNode && 'Output'}
              {IsPromptChainItem(chainNode) && prompts.find(prompt => prompt.id === chainNode.promptID)?.name}
              {IsCodeChainItem(chainNode) && NameForCodeChainItem(chainNode)}
            </HeaderItem>
          )}
          <div className='flex items-center gap-1'>
            {savedVersion && (
              <CommentPopupMenu
                comments={savedVersion.comments.filter(comment => comment.itemIndex === itemIndex)}
                itemIndex={itemIndex}
                versionID={savedVersion.id}
                users={chain.users}
                selectedCell={isSelected}
              />
            )}
            {(IsPromptChainItem(chainNode) || IsCodeChainItem(chainNode)) && (
              <ChainNodePopupMenu onDelete={onDelete} onEdit={onEdit} onRename={onRename} selected={isSelected} />
            )}
          </div>
        </div>
        {IsPromptChainItem(chainNode) && (
          <PromptVersionContent item={chainNode} isSelected={isSelected} promptCache={promptCache} />
        )}
      </div>
    </>
  )
}

function PromptVersionContent({
  item,
  isSelected,
  promptCache,
}: {
  item: PromptChainItem
  isSelected: boolean
  promptCache: PromptCache
}) {
  const colorClass = isSelected ? 'border-blue-100' : 'border-gray-200 bg-white rounded-b-lg'
  const prompt = promptCache.promptForItem(item)
  const version = promptCache.versionForItem(item)
  const index = prompt?.versions?.findIndex(v => v.id === version?.id) ?? 0
  return prompt && version ? (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-1 pb-3 pl-8 -mt-2 ml-0.5'>
        <span className='text-xs font-medium text-gray-500'>
          {LabelForModel(version.config.model)} | Prompt version {index + 1}
        </span>
        <VersionLabels version={version} colors={AvailableLabelColorsForItem(prompt)} hideChainReferences />
      </div>
      <div className={`p-3 border-t ${colorClass}`}>
        <TaggedVersionPrompt version={version} />
      </div>
    </div>
  ) : null
}
