import { Children, cloneElement } from 'react'

export function Segment<T>({
  value,
  title,
  selected,
  callback,
  first,
  last,
}: {
  title: string
  value: T
  selected?: T
  callback?: (value: T) => void
  first?: boolean
  last?: boolean
}) {
  const baseStyle = 'px-6 py-2 cursor-pointer'
  const firstLastStyle = first ? 'rounded-l-lg' : last ? 'rounded-r-lg' : ''
  const selectedStyle = selected === value ? 'bg-gray-500 text-white rounded-lg' : ''
  return (
    <div className={`${baseStyle} ${firstLastStyle} ${selectedStyle}`} onClick={() => callback?.(value)}>
      {title}
    </div>
  )
}

export default function SegmentedControl<T>({
  children,
  selected,
  callback,
}: {
  children: any
  selected: T
  callback: (value: T) => void
}) {
  return (
    <div className='flex border border-gray-300 rounded-lg'>
      {Children.map(children, (child, index) =>
        cloneElement(child, { selected, callback, first: index === 0, last: index === children.length - 1 })
      )}
    </div>
  )
}
