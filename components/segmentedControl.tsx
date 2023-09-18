import { Children, cloneElement } from 'react'

export function Segment<T>({
  value,
  title,
  selected,
  callback,
  first,
  last,
  disabled,
}: {
  title: string
  value: T
  selected?: T
  callback?: (value: T) => void
  first?: boolean
  last?: boolean
  disabled?: boolean
}) {
  const firstLastStyle = first ? 'rounded-l-lg' : last ? 'rounded-r-lg' : ''
  const selectedStyle = selected === value ? 'bg-gray-500 text-white rounded-lg' : ''
  const colorStyle = selected === value ? (disabled ? 'bg-gray-500' : 'bg-blue-500') : ''
  const cursorStyle = disabled || selected === value ? 'cursor-default' : 'cursor-pointer'
  return (
    <div
      className={`px-6 py-2 ${firstLastStyle} ${selectedStyle} ${colorStyle} ${cursorStyle}`}
      onClick={disabled ? undefined : () => callback?.(value)}>
      {title}
    </div>
  )
}

export default function SegmentedControl<T>({
  className = '',
  children,
  selected,
  callback,
  disabled,
}: {
  className?: string
  children: any
  selected: T
  callback: (value: T) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex border border-gray-300 rounded-lg bg-white ${className}`}>
      {Children.map(children, (child, index) =>
        cloneElement(child, { selected, disabled, callback, first: index === 0, last: index === children.length - 1 })
      )}
    </div>
  )
}
