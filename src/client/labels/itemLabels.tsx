import Icon from '@/src/client/components/icon'

export default function ItemLabels({
  labels,
  colors,
  icons = {},
  noWrap = false,
  className = '',
}: {
  labels: string[]
  colors: Record<string, string>
  icons?: Record<string, any>
  noWrap?: boolean
  className?: string
}) {
  return labels.length > 0 ? (
    <div className={`${className} flex flex-wrap gap-1 ${noWrap ? 'overflow-hidden max-h-5' : ''}`}>
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
