import { ActivePrompt, ChainItemWithInputs, ChainVersion } from '@/types'
import { ContentComparison } from '@/src/client/versions/versionComparison'
import { LabelForProvider } from '@/src/common/providerMetadata'
import { IsBranchChainItem, IsCodeChainItem, IsQueryChainItem } from './chainNode'
import { ActiveItemCache } from '@/src/client/projects/useActiveItemCache'

export default function ChainVersionCellBody({
  version,
  isActiveVersion,
  compareVersion,
  itemCache,
}: {
  version: ChainVersion
  isActiveVersion: boolean
  compareVersion?: ChainVersion
  itemCache: ActiveItemCache<ActivePrompt>
}) {
  const getContent = (version: ChainVersion) => ContentsForChainVersion(version, itemCache).join('\n')

  return (
    <div className={isActiveVersion ? '' : 'line-clamp-2'}>
      <ContentComparison
        content={getContent(version)}
        compareContent={compareVersion ? getContent(compareVersion) : undefined}
      />
    </div>
  )
}

export const ContentsForChainVersion = (version: ChainVersion, itemCache: ActiveItemCache<ActivePrompt>) =>
  version.items.map(item => GetChainItemTitle(item, itemCache))

export const GetChainItemTitle = (item: ChainItemWithInputs, itemCache: ActiveItemCache<ActivePrompt>) => {
  if (IsCodeChainItem(item)) {
    return `• Code block${item.name ? `: ${item.name}` : ''}`
  } else if (IsBranchChainItem(item)) {
    return `• Branch: ${item.branches.join(' | ')}`
  } else if (IsQueryChainItem(item)) {
    const indexNameInfix = item.indexName ? ` “${item.indexName}”` : ''
    return `• Query: ${LabelForProvider(item.provider)}${indexNameInfix} (${item.topK} Top-K)`
  } else {
    let versionSuffix = ''
    const prompt = itemCache.itemForID(item.promptID)
    if (prompt) {
      const versionIndex = prompt.versions.findIndex(version => version.id === item.versionID)
      if (versionIndex >= 0) {
        versionSuffix = ` (Version ${versionIndex + 1})`
      }
    }
    return `• Prompt: ${itemCache.nameForID(item.promptID)}${versionSuffix}`
  }
}
