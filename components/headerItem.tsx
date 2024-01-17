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

export const EditableHeaderItem = ({
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) => (
  <EditableItem className={headerClassName} value={value} onChange={onChange} onSubmit={onSubmit} onCancel={onCancel} />
)

export function EditableItem({
  className = '',
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  className?: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  const inputRef = useCallback((node: any) => node?.select(), [])

  const submit = () => value.trim().length > 0 ? onSubmit() : onCancel()

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      submit()
    } else if (event.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className={className}
      value={value}
      onChange={event => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={submit}
    />
  )
}
