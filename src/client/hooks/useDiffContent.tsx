import { IsBranchChainItem, IsCodeChainItem, IsPromptChainItem, IsQueryChainItem } from '@/components/chains/chainNode'
import { IsEndpoint } from '@/src/common/activeItem'
import {
  ActiveChain,
  ActiveProject,
  ActivePrompt,
  AvailableModelProvider,
  ChainItem,
  ChainItemWithInputs,
  ChainVersion,
  Endpoint,
  IsPromptVersion,
  ProjectItemIsChain,
  PromptVersion,
} from '@/types'
import useActiveItemCache, { ActiveItemCache } from './useActiveItemCache'
import { PromptTab } from '@/components/prompts/promptPanel'
import { LabelForProvider } from '@/src/common/providerMetadata'
import useAvailableProviders from './useAvailableProviders'
import { FormatPromptConfig } from '@/components/prompts/promptVersionCellBody'

type ItemType = ActivePrompt | ActiveChain | Endpoint
type VersionType = PromptVersion | ChainVersion

export default function useDiffContent(
  project: ActiveProject,
  leftItem?: ItemType,
  rightItem?: ItemType,
  leftVersion?: VersionType,
  rightVersion?: VersionType
) {
  const getCacheItemIDs = (item?: ItemType, version?: VersionType) =>
    IsEndpoint(item)
      ? [item.parentID]
      : version && !IsPromptVersion(version)
      ? (version.items as ChainItem[]).filter(IsPromptChainItem).map(item => item.promptID)
      : []

  const itemCache = useActiveItemCache(project, [
    ...getCacheItemIDs(leftItem, leftVersion),
    ...getCacheItemIDs(rightItem, rightVersion),
  ])

  const availableProviders = useAvailableProviders()

  const getContent = (item?: ItemType, version?: VersionType) =>
    IsEndpoint(item)
      ? getEndpointContent(item, itemCache)
      : version
      ? getVersionContent(version, availableProviders, itemCache)
      : undefined

  const leftContent = getContent(leftItem, leftVersion)
  const rightContent = getContent(rightItem, rightVersion)

  return [leftContent, rightContent] as const
}

const getEndpointContent = (endpoint: Endpoint, itemCache: ActiveItemCache) => {
  let parentInfo = '…'
  const parent = itemCache.itemForID(endpoint.parentID)
  if (parent) {
    const versionIndex = parent.versions.findIndex(version => version.id === endpoint.versionID)
    if (versionIndex >= 0) {
      const label = ProjectItemIsChain(parent) ? 'Chain' : 'Prompt'
      parentInfo = `${label}: ${parent.name}\nVersion: ${versionIndex + 1}`
    }
  }
  return `Enabled: ${endpoint.enabled ? 'Yes' : 'No'}
${parentInfo}
Name: ${endpoint.urlPath}
Environment: ${endpoint.flavor}
Cache Responses: ${endpoint.useCache ? 'Yes' : 'No'}
Stream Responses: ${endpoint.useStreaming ? 'Yes' : 'No'}
`
}

const getVersionContent = (
  version: ChainVersion | PromptVersion,
  availableProviders: AvailableModelProvider[],
  itemCache: ActiveItemCache
) =>
  IsPromptVersion(version)
    ? getPromptVersionContent(version, availableProviders)
    : getChainVersionContent(version, itemCache)

const getPromptVersionContent = (version: PromptVersion, availableProviders: AvailableModelProvider[]) =>
  `${FormatPromptConfig(version.config, availableProviders)}\n\n` +
  `${version.prompts.system ? `System:\n${version.prompts.system}\n\n` : ''}` +
  `Prompt:\n${version.prompts.main}\n\n` +
  `${version.prompts.functions ? `Functions:\n${version.prompts.functions}\n\n` : ''}`

const getChainVersionContent = (version: ChainVersion, itemCache: ActiveItemCache) =>
  version.items.map(item => getChainItemContent(item, itemCache)).join('\n')

const getChainItemContent = (item: ChainItemWithInputs, itemCache: ActiveItemCache) => {
  const outputSuffix = item.output ? `→ ${item.output}` : ''
  return `${getChainItemTitle(item, itemCache)}\n${getChainItemBody(item, itemCache)}\n${outputSuffix}\n`
}

const getChainItemTitle = (item: ChainItemWithInputs, itemCache: ActiveItemCache) => {
  if (IsCodeChainItem(item)) {
    return `• Code block: ${item.name ?? ''}`
  } else if (IsBranchChainItem(item)) {
    return `• Branch: ${item.branches.join(' | ')}`
  } else if (IsQueryChainItem(item)) {
    return `• Query: ${LabelForProvider(item.provider)} “${item.indexName}” (${item.topK} Top-K)`
  } else {
    let versionSuffix = ''
    const prompt = itemCache.itemForID(item.promptID) as ActivePrompt | undefined
    if (prompt) {
      const versionIndex = prompt.versions.findIndex(version => version.id === item.versionID)
      if (versionIndex >= 0) {
        versionSuffix = ` (Version ${versionIndex + 1})`
      }
    }
    return `• Prompt: ${itemCache.nameForID(item.promptID)}${versionSuffix}`
  }
}

const getChainItemBody = (item: ChainItemWithInputs, itemCache: ActiveItemCache) => {
  if (IsCodeChainItem(item) || IsBranchChainItem(item)) {
    return item.code
  } else if (IsQueryChainItem(item)) {
    return item.query
  } else {
    const prompt = itemCache.itemForID(item.promptID) as ActivePrompt | undefined
    if (prompt) {
      const promptVersion = prompt.versions.find(version => version.id === item.versionID)
      if (promptVersion) {
        return promptVersion.prompts['main']
      }
    }
    return '…'
  }
}
