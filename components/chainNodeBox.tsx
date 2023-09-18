import { ActiveChain, ChainVersion, Prompt, PromptChainItem } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, NameForCodeChainItem, OutputNode } from './chainNode'
import { HeaderItem } from './tabSelector'
import promptIcon from '@/public/prompt.svg'
import codeIcon from '@/public/code.svg'
import Icon from './icon'
import ChainNodePopupMenu from './chainNodePopupMenu'
import CommentPopupMenu from './commentPopupMenu'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import { LabelForModel } from './modelSelector'
import { VersionLabels } from './versionCell'
import { AvailableLabelColorsForItem } from './labelPopupMenu'
import { ChainNodeBoxConnector } from './chainNodeBoxConnector'

export function ChainNodeBox({
  chain,
  savedVersion,
  chainNode,
  itemIndex,
  isFirst,
  isSelected,
  onSelect,
  isMenuActive,
  setMenuActive,
  onInsertPrompt,
  onInsertNewPrompt,
  onInsertCodeBlock,
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
  onSelect: () => void
  isMenuActive: boolean
  setMenuActive: (active: boolean) => void
  onInsertPrompt: (promptID: number) => void
  onInsertNewPrompt: () => void
  onInsertCodeBlock: () => void
  onDelete: () => void
  prompts: Prompt[]
  promptCache: PromptCache
}) {
  const colorClass = isSelected ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-400'
  const icon = IsPromptChainItem(chainNode) ? promptIcon : IsCodeChainItem(chainNode) ? codeIcon : undefined
  return (
    <>
      {!isFirst && (
        <ChainNodeBoxConnector
          prompts={prompts}
          isActive={isMenuActive}
          setActive={setMenuActive}
          onInsertPrompt={onInsertPrompt}
          onInsertNewPrompt={onInsertNewPrompt}
          onInsertCodeBlock={onInsertCodeBlock}
        />
      )}
      <div className={`flex flex-col border px-2 w-96 rounded-lg cursor-pointer ${colorClass}`} onClick={onSelect}>
        <div className='flex items-center justify-between'>
          <HeaderItem>
            {icon && <Icon className='mr-0.5 -ml-2' icon={icon} />}
            {chainNode === InputNode && 'Inputs'}
            {chainNode === OutputNode && 'Output'}
            {IsPromptChainItem(chainNode) && prompts.find(prompt => prompt.id === chainNode.promptID)?.name}
            {IsCodeChainItem(chainNode) && NameForCodeChainItem(chainNode)}
          </HeaderItem>
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
            <ChainNodePopupMenu onDelete={onDelete} selected={isSelected} />
          </div>
        </div>
        {IsPromptChainItem(chainNode) && <PromptVersionHeader item={chainNode} promptCache={promptCache} />}
      </div>
    </>
  )
}

function PromptVersionHeader({ item, promptCache }: { item: PromptChainItem; promptCache: PromptCache }) {
  const prompt = promptCache.promptForItem(item)
  const version = promptCache.versionForItem(item)
  const index = prompt?.versions?.findIndex(v => v.id === version?.id) ?? 0
  return prompt && version ? (
    <div className='flex flex-col gap-1 pb-3 pl-6 -mt-2 ml-0.5'>
      <span className='text-xs font-medium text-gray-500'>
        {LabelForModel(version.config.model)} | Prompt version {index + 1}
      </span>
      <VersionLabels version={version} colors={AvailableLabelColorsForItem(prompt)} hideChainReferences />
    </div>
  ) : null
}
