import { BranchChainItem, ChainItem, CodeChainItem, PromptChainItem, QueryChainItem } from '@/types'
import {
  ChainNode,
  InputNode,
  IsBranchChainItem,
  IsCodeChainItem,
  IsPromptChainItem,
  IsQueryChainItem,
} from './chainNode'
import { ChainItemCache } from '@/src/client/chains/useChainItemCache'
import { VersionLabels } from '@/src/client/versions/versionLabels'
import { AvailableLabelColorsForItem } from '@/src/client/labels/labelsPopup'
import { TaggedContent } from '@/src/client/versions/versionComparison'
import { ReactNode } from 'react'
import { InputVariableClass } from '@/src/client/prompts/promptInput'
import { VersionDescription } from '@/src/client/comments/commentsPane'
import { Highlight, themes } from 'prism-react-renderer'
import { ExtractUnboundChainVariables } from './chainItems'

export default function ChainNodeBoxBody({
  items,
  chainNode,
  isSelected,
  itemCache,
}: {
  items: ChainItem[]
  chainNode: ChainNode
  isSelected: boolean
  itemCache: ChainItemCache
}) {
  return (
    <>
      {IsPromptChainItem(chainNode) && (
        <PromptNodeBody item={chainNode} isSelected={isSelected} itemCache={itemCache} />
      )}
      {(IsCodeChainItem(chainNode) || IsBranchChainItem(chainNode)) && (
        <CodeNodeBody item={chainNode} isSelected={isSelected} />
      )}
      {IsQueryChainItem(chainNode) && <QueryNodeBody item={chainNode} isSelected={isSelected} />}
      {chainNode === InputNode && <InputNodeBody items={items} isSelected={isSelected} itemCache={itemCache} />}
    </>
  )
}

function PromptNodeBody({
  item,
  isSelected,
  itemCache,
}: {
  item: PromptChainItem
  isSelected: boolean
  itemCache: ChainItemCache
}) {
  const prompt = itemCache.promptForItem(item)
  const version = itemCache.versionForItem(item)
  const index = prompt?.versions?.findIndex(v => v.id === version?.id) ?? 0
  return prompt && version ? (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-1 pb-3 pl-8 -mt-2.5 ml-0.5'>
        <VersionDescription index={index + 1} version={version} />
        <VersionLabels version={version} colors={AvailableLabelColorsForItem(prompt)} hideChainReferences />
      </div>
      <CommonBody isSelected={isSelected}>
        <TaggedContent content={version.prompts.main || (version.prompts.system ?? '')} />
      </CommonBody>
    </div>
  ) : null
}

function CodeNodeBody({ item, isSelected }: { item: CodeChainItem | BranchChainItem; isSelected: boolean }) {
  const description = IsCodeChainItem(item) ? item.description : undefined
  return description || item.code ? (
    <CommonBody isSelected={isSelected}>
      {description || (
        <Highlight theme={themes.github} code={item.code.trim()} language='javascript'>
          {({ tokens, getLineProps, getTokenProps }) => (
            <>
              {tokens.map((line, lineIndex) => (
                <div key={lineIndex} {...getLineProps({ line })}>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </>
          )}
        </Highlight>
      )}
    </CommonBody>
  ) : null
}

function QueryNodeBody({ item, isSelected }: { item: QueryChainItem; isSelected: boolean }) {
  return item.query ? (
    <CommonBody isSelected={isSelected}>
      <TaggedContent content={item.query} />
    </CommonBody>
  ) : null
}

function InputNodeBody({
  items,
  isSelected,
  itemCache,
}: {
  items: ChainItem[]
  isSelected: boolean
  itemCache: ChainItemCache
}) {
  const variables = ExtractUnboundChainVariables(items, itemCache, false)

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
