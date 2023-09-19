import { PromptChainItem } from '@/types'
import { ChainNode, InputNode, IsChainItem, IsPromptChainItem } from './chainNode'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import { LabelForModel } from '../prompts/modelSelector'
import { VersionLabels } from '../versions/versionCell'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { TaggedVersionPrompt } from '../versions/versionComparison'
import { ReactNode } from 'react'
import { ExtractUnboundChainVariables } from './chainNodeOutput'
import { InputVariableClass } from '../prompts/promptInput'

export default function ChainNodeBoxBody({
  nodes,
  chainNode,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  chainNode: ChainNode
  isSelected: boolean
  promptCache: PromptCache
}) {
  return (
    <>
      {IsPromptChainItem(chainNode) && (
        <PromptNodeBody item={chainNode} isSelected={isSelected} promptCache={promptCache} />
      )}
      {chainNode === InputNode && <InputNodeBody nodes={nodes} isSelected={isSelected} promptCache={promptCache} />}
    </>
  )
}

function PromptNodeBody({
  item,
  isSelected,
  promptCache,
}: {
  item: PromptChainItem
  isSelected: boolean
  promptCache: PromptCache
}) {
  const prompt = promptCache.promptForItem(item)
  const version = promptCache.versionForItem(item)
  const index = prompt?.versions?.findIndex(v => v.id === version?.id) ?? 0
  return prompt && version ? (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-1 pb-3 pl-8 -mt-2.5 ml-0.5'>
        <span className='text-xs font-medium text-gray-500'>
          {LabelForModel(version.config.model)} | Prompt version {index + 1}
        </span>
        <VersionLabels version={version} colors={AvailableLabelColorsForItem(prompt)} hideChainReferences />
      </div>
      <CommonBody isSelected={isSelected}>
        <TaggedVersionPrompt version={version} />
      </CommonBody>
    </div>
  ) : null
}

function InputNodeBody({
  nodes,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  isSelected: boolean
  promptCache: PromptCache
}) {
  const items = nodes.filter(IsChainItem)
  const variables = ExtractUnboundChainVariables(items, promptCache)

  return variables.length > 0 ? (
    <CommonBody isSelected={isSelected}>
      <div className='flex flex-wrap gap-1'>
        {variables.map((variable, index) => (
          <span key={index} className={`${InputVariableClass}`}>{`{{${variable}}}`}</span>
        ))}
      </div>
    </CommonBody>
  ) : null
}

function CommonBody({ isSelected, children }: { isSelected: boolean; children: ReactNode }) {
  const colorClass = isSelected ? 'border-blue-100' : 'border-gray-200 bg-white rounded-b-lg'
  return <div className={`p-3 border-t ${colorClass} max-h-[150px] overflow-y-auto`}>{children}</div>
}
