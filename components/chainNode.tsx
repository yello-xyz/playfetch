import { ChainItem, CodeChainItem, CodeConfig, PromptChainItem, RunConfig } from '@/types'

export const InputNode = 'input'
export const OutputNode = 'output'
export type ChainNode = PromptChainItem | CodeChainItem | typeof InputNode | typeof OutputNode

export const IsChainItem = (item: ChainNode): item is ChainItem => item !== InputNode && item !== OutputNode
export const IsPromptChainItem = (item: ChainNode): item is PromptChainItem => IsChainItem(item) && 'promptID' in item
export const IsCodeChainItem = (item: ChainNode): item is CodeChainItem => IsChainItem(item) && 'code' in item
