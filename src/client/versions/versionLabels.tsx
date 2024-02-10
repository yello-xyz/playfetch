import { PromptVersion, ChainVersion } from '@/types'
import chainIcon from '@/public/chainSmall.svg'
import endpointIcon from '@/public/endpointSmall.svg'
import ItemLabels from '@/src/client/labels/itemLabels'

export function VersionLabels<Version extends PromptVersion | ChainVersion>({
  version,
  colors,
  hideChainReferences,
  hideEndpointReferences,
  noWrap,
  className = '',
}: {
  version: Version
  colors: Record<string, string>
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
  noWrap?: boolean
  className?: string
}) {
  const usedInChain = 'used in Chain'
  const usedAsEndpoint = 'used as Endpoint'
  const extraColor = 'bg-pink-100 text-black'
  const extraColors = { [usedInChain]: extraColor, [usedAsEndpoint]: extraColor }
  const extraIcons = { [usedInChain]: chainIcon, [usedAsEndpoint]: endpointIcon }
  const extraLabels = [
    ...(!hideChainReferences && 'usedInChain' in version && version.usedInChain ? [usedInChain] : []),
    ...(!hideEndpointReferences && version.usedAsEndpoint ? [usedAsEndpoint] : []),
  ]

  return (
    <ItemLabels
      labels={[...version.labels, ...extraLabels]}
      colors={{ ...colors, ...extraColors }}
      icons={extraIcons}
      noWrap={noWrap}
      className={className}
    />
  )
}
