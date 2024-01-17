import { KeyboardEvent, ReactNode, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'

const headerClassName =
  'select-none px-2 py-1.5 font-medium outline-none whitespace-nowrap leading-6 text-gray-700 bg-transparent'

export function HeaderItem({
  active = true,
  className = '',
  onClick,
  draggableID,
  children,
}: {
  active?: boolean
  className?: string
  onClick?: () => void
  draggableID?: string
  children?: ReactNode
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    disabled: !draggableID,
    id: draggableID ?? '',
    data: { name: draggableID },
  })
  const activeClass = active ? '' : 'opacity-40 hover:opacity-70'

  return (
    <div
      {...(draggableID ? { ref: setNodeRef, ...listeners, ...attributes } : {})}
      className={`flex ${className} ${headerClassName} ${activeClass}`}
      onClick={onClick}>
      {children}
    </div>
  )
}

export function EditableHeaderItem({
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  const inputRef = useCallback((node: any) => node?.select(), [])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSubmit()
    } else if (event.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className={headerClassName}
      value={value}
      onChange={event => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onSubmit}
    />
  )
}
