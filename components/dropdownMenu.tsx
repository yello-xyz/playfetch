import chevronIcon from '@/public/chevron.svg'
import { MouseEventHandler } from 'react'

export default function DropdownMenu({
  size = 'sm',
  className = '',
  disabled,
  children,
  value,
  onChange,
  onFocus,
  onBlur,
  onClick,
}: {
  size?: 'xs' | 'sm' | 'md'
  className?: string
  disabled?: boolean
  children: any
  value: string | number | undefined
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onClick?: MouseEventHandler<HTMLSelectElement>
}) {
  const sizeClass = size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-sm font-medium'
  const padding = size === 'xs' ? 'py-1' : 'py-2'
  const stateClass = disabled ? 'opacity-50' : 'cursor-pointer'
  const appearanceClass =
    'appearance-none border border-gray-300 rounded-md outline-none bg-no-repeat bg-[right_6px_center]'
  return (
    <select
      disabled={disabled}
      className={`${sizeClass} ${stateClass} ${appearanceClass} ${className} ${padding} pl-2 pr-8 text-gray-700`}
      style={{ backgroundImage: `url('${chevronIcon.src}')` }}
      value={value}
      onChange={event => {
        onChange(event.target.value)
        if (onBlur) {
          event.target.blur()
        }
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}>
      {children}
    </select>
  )
}
