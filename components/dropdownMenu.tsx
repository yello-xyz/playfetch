import chevronIcon from '@/public/chevron.svg'

export default function DropdownMenu({
  size = 'small',
  className = '',
  disabled,
  children,
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  size?: 'small' | 'medium'
  className?: string
  disabled?: boolean
  children: any
  value: string | number | undefined
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
}) {
  const sizeClass = size === 'small' ? 'text-xs' : 'text-sm font-medium'
  const stateClass = disabled ? 'opacity-50' : 'cursor-pointer'
  const appearanceClass =
    'appearance-none border border-gray-300 rounded-md outline-none bg-no-repeat bg-[right_6px_center]'
  return (
    <select
      disabled={disabled}
      className={`${sizeClass} ${stateClass} ${appearanceClass} ${className} w-full py-2 pl-4 pr-8 text-gray-800`}
      style={{ backgroundImage: `url('${chevronIcon.src}')` }}
      value={value}
      onChange={event => {
        onChange(event.target.value)
        if (onBlur) {
          event.target.blur()
        }
      }}
      onFocus={onFocus}
      onBlur={onBlur}>
      {children}
    </select>
  )
}
