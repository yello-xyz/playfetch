import { ChainItem, ChainItemWithInputs } from '@/types'
import {
  ChainNode,
  IsBranchChainItem,
  IsCodeChainItem,
  IsPromptChainItem,
  IsQueryChainItem,
  SubtreeForChainNode,
} from './chainNode'
import { ChainItemCache } from '../../src/client/hooks/useChainItemCache'
import { ExtractCodeInterrupts, ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'

export const GetChainItemsSaveKey = (items: ChainItem[]) => JSON.stringify(stripItemsToSave(items))

export const GetItemsToSave = (items: ChainItem[], itemCache: ChainItemCache) =>
  augmentItemsToSave(stripItemsToSave(items), itemCache)

const stripItemsToSave = (items: ChainItem[]): ChainItem[] =>
  items.map(item => {
    return IsCodeChainItem(item) || IsBranchChainItem(item) || IsQueryChainItem(item)
      ? item
      : {
          ...item,
          activePrompt: undefined,
          version: undefined,
        }
  })

const augmentItemsToSave = (items: ChainItem[], itemCache: ChainItemCache) =>
  items.map(item => {
    const inputs = ExtractChainItemVariables(item, itemCache, false)
    return IsCodeChainItem(item) || IsBranchChainItem(item) || IsQueryChainItem(item)
      ? { ...item, inputs }
      : {
          ...item,
          inputs,
          dynamicInputs: ExtractChainItemVariables(item, itemCache, true).filter(input => !inputs.includes(input)),
        }
  })

export const ExtractChainItemVariables = (item: ChainItem, cache: ChainItemCache, includingDynamic: boolean) => {
  if (IsCodeChainItem(item) || IsBranchChainItem(item)) {
    return [...ExtractVariables(item.code), ...(includingDynamic ? ExtractCodeInterrupts(item.code) : [])]
  }
  if (IsQueryChainItem(item)) {
    return ExtractVariables(item.query)
  }
  const version = cache.versionForItem(item)
  return version
    ? ExtractPromptVariables(version.prompts, version.config, includingDynamic)
    : extractChainItemInputs(item, includingDynamic)
}

const extractChainItemInputs = (item: ChainItem, includingDynamic: boolean) => [
  ...(item.inputs ?? []),
  ...(includingDynamic && IsPromptChainItem(item) ? item.dynamicInputs ?? [] : []),
]

export const ExtractUnboundChainVariables = (chain: ChainItem[], cache: ChainItemCache, includingDynamic: boolean) =>
  excludeBoundChainVariables(
    chain.map(item => ({ ...item, inputs: ExtractChainItemVariables(item, cache, includingDynamic) }))
  )

export const ExtractUnboundChainInputs = (chainWithInputs: ChainItemWithInputs[], includingDynamic: boolean) =>
  excludeBoundChainVariables(
    chainWithInputs.map(item => ({ ...item, inputs: extractChainItemInputs(item, includingDynamic) }))
  )

const excludeBoundChainVariables = (chain: Omit<ChainItemWithInputs, 'dynamicInputs'>[]) => {
  const outputToSubtreeIndex = {} as Record<string, number[]>
  chain.forEach(({ output }, index) => {
    if (output) {
      outputToSubtreeIndex[output] = [...(outputToSubtreeIndex[output] ?? []), index]
    }
  })
  const unmappedInputs = [] as string[]
  chain.forEach(item => {
    item.inputs.forEach(input => {
      if (
        !(outputToSubtreeIndex[input] ?? []).some(index =>
          SubtreeForChainNode(chain[index] as ChainNode, chain as ChainNode[], false).includes(item as ChainItem)
        )
      ) {
        unmappedInputs.push(input)
      }
    })
  })
  return [...new Set(unmappedInputs)]
}
