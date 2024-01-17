import { ChainItem } from '@/types'
import { IsBranchChainItem, IsCodeChainItem, IsQueryChainItem } from './chainNode'
import { ExtractChainItemVariables } from './chainNodeOutput'
import { ChainPromptCache } from '../../src/client/hooks/useChainPromptCache'

export const GetChainItemsSaveKey = (items: ChainItem[]) => JSON.stringify(stripItemsToSave(items))

export const GetItemsToSave = (items: ChainItem[], promptCache: ChainPromptCache) =>
  augmentItemsToSave(stripItemsToSave(items), promptCache)

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

const augmentItemsToSave = (items: ChainItem[], promptCache: ChainPromptCache) =>
  items.map(item => {
    const inputs = ExtractChainItemVariables(item, promptCache, false)
    return IsCodeChainItem(item) || IsBranchChainItem(item) || IsQueryChainItem(item)
      ? { ...item, inputs }
      : {
          ...item,
          inputs,
          dynamicInputs: ExtractChainItemVariables(item, promptCache, true).filter(input => !inputs.includes(input)),
        }
  })
