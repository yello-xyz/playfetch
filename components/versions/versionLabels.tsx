import { PromptVersion, ChainVersion } from '@/types'
import chainIcon from '@/public/chainSmall.svg'
import endpointIcon from '@/public/endpointSmall.svg'
import Icon from '../icon'

export function VersionLabels<Version extends PromptVersion | ChainVersion>({
  version,
  colors,
  hideChainReferences,
  hideEndpointReferences,
  noWrap,
}: {
  version: Version
  colors: Record<string, string>
  hideChainReferences?: boolean
  hideEndpointReferences?: boolean
  noWrap?: boolean
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
    />
  )
}

export function ItemLabels({
  labels,
  colors,
  icons = {},
  noWrap,
}: {
  labels: string[]
  colors: Record<string, string>
  icons?: Record<string, any>
  noWrap?: boolean
}) {
  return labels.length > 0 ? (
    <div className={`flex flex-wrap gap-1 ${noWrap ? 'overflow-hidden max-h-5' : ''}`}>
      {labels.map((label, labelIndex) => (
        <ItemLabel label={label} colors={colors} icons={icons} key={labelIndex} />
      ))}
    </div>
  ) : null
}

export function ItemLabel({
  label,
  colors,
  icons = {},
}: {
  label: string
  colors: Record<string, string>
  icons?: Record<string, any>
}) {
  const color = colors[label] ?? 'bg-gray-400'
  const icon = icons[label]
  return (
    <span className={`pl-1 pr-1.5 text-xs gap-0.5 flex items-center whitespace-nowrap rounded ${color}`}>
      {icon ? <Icon icon={icon} className='-my-0.5' /> : null}
      {label}
    </span>
  )
}
