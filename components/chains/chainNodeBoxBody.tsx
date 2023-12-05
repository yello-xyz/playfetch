import { ChainItem, CodeChainItem, PromptChainItem, QueryChainItem } from '@/types'
import { ChainNode, InputNode, IsCodeChainItem, IsPromptChainItem, IsQueryChainItem } from './chainNode'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import { VersionLabels } from '../versions/versionLabels'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { TaggedContent } from '../versions/versionComparison'
import { ReactNode } from 'react'
import { ExtractUnboundChainVariables } from './chainNodeOutput'
import { InputVariableClass } from '../prompts/promptInput'
import { VersionDescription } from '../commentsPane'
import { Highlight, themes } from 'prism-react-renderer'

export default function ChainNodeBoxBody({
  items,
  chainNode,
  isSelected,
  promptCache,
}: {
  items: ChainItem[]
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
      {chainNode === InputNode && <InputNodeBody items={items} isSelected={isSelected} promptCache={promptCache} />}
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
  return prompt && version ? (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-1 pb-3 pl-8 -mt-2.5 ml-0.5'>
        <VersionDescription index={index + 1} version={version} />
        <VersionLabels version={version} colors={AvailableLabelColorsForItem(prompt)} hideChainReferences />
      </div>
      <CommonBody isSelected={isSelected}>
        <TaggedContent content={version.prompts.main} />
      </CommonBody>
    </div>
  ) : null
}

function CodeNodeBody({ item, isSelected }: { item: CodeChainItem; isSelected: boolean }) {
  return item.description || item.code ? (
    <CommonBody isSelected={isSelected}>
      {item.description || (
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
  promptCache,
}: {
  items: ChainItem[]
  isSelected: boolean
  promptCache: ChainPromptCache
}) {
  const variables = ExtractUnboundChainVariables(items, promptCache, false)

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
