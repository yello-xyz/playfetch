export default function DropdownMenu({
  size = 'small',
  disabled,
  children,
  value,
  onChange,
}: {
  size?: 'small' | 'medium'
  disabled?: boolean
  children: any
  value: string | number | undefined
  onChange: (value: string) => void
}) {
  const sizeClass = size === 'small' ? 'text-xs' : 'text-sm font-medium'
  return (
    <select
      disabled={disabled}
      className={`${sizeClass} w-full p-2 text-gray-800 border-r-8 border-transparent rounded-md outline outline-gray-300`}
      value={value}
      onChange={event => onChange(event.target.value)}>
      {children}
    </select>
  )
}
