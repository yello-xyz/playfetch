import { CodeChainItem, PromptChainItem, QueryChainItem } from '@/types'
import { ChainNode, InputNode, IsChainItem, IsCodeChainItem, IsPromptChainItem, IsQueryChainItem } from './chainNode'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import { LabelForModel } from '@/src/common/providerMetadata'
import { VersionLabels } from '../versions/versionCell'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { TaggedVersionPrompt } from '../versions/versionComparison'
import { ReactNode } from 'react'
import { ExtractUnboundChainVariables } from './chainNodeOutput'
import { InputVariableClass } from '../prompts/promptInput'
import useAvailableProviders from '@/src/client/hooks/useAvailableProviders'

export default function ChainNodeBoxBody({
  nodes,
  chainNode,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  chainNode: ChainNode
  isSelected: boolean
  promptCache: ChainPromptCache
}) {
  return (
    <>
      {IsPromptChainItem(chainNode) && (
        <PromptNodeBody item={chainNode} isSelected={isSelected} promptCache={promptCache} />
      )}
      {IsCodeChainItem(chainNode) && <CodeNodeBody item={chainNode} isSelected={isSelected} />}
      {IsQueryChainItem(chainNode) && <QueryNodeBody item={chainNode} isSelected={isSelected} />}
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
  promptCache: ChainPromptCache
}) {
  const prompt = promptCache.promptForItem(item)
  const version = promptCache.versionForItem(item)
  const index = prompt?.versions?.findIndex(v => v.id === version?.id) ?? 0
  const availableProviders = useAvailableProviders()
  return prompt && version ? (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-1 pb-3 pl-8 -mt-2.5 ml-0.5'>
        <span className='text-xs font-medium text-gray-500'>
          {LabelForModel(version.config.model, availableProviders)} | Prompt version {index + 1}
        </span>
        <VersionLabels version={version} colors={AvailableLabelColorsForItem(prompt)} hideChainReferences />
      </div>
      <CommonBody isSelected={isSelected}>
        <TaggedVersionPrompt version={version} />
      </CommonBody>
    </div>
  ) : null
}

function CodeNodeBody({ item, isSelected }: { item: CodeChainItem; isSelected: boolean }) {
  return item.description ? (
    <CommonBody isSelected={isSelected}>
      <span className=''>{item.description}</span>
    </CommonBody>
  ) : null
}

function QueryNodeBody({ item, isSelected }: { item: QueryChainItem; isSelected: boolean }) {
  return item.query ? (
    <CommonBody isSelected={isSelected}>
      <span className=''>{item.query}</span>
    </CommonBody>
  ) : null
}

function InputNodeBody({
  nodes,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  isSelected: boolean
  promptCache: ChainPromptCache
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
