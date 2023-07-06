import chevronIcon from '@/public/chevron.svg'

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
      className={`${sizeClass} appearance-none w-full py-2 pl-4 pr-8 text-gray-800 border border-gray-300 rounded-md outline-none bg-no-repeat bg-[right_6px_center]`}
      style={{ backgroundImage: `url('${chevronIcon.src}')` }}
      value={value}
      onChange={event => onChange(event.target.value)}>
      {children}
    </select>
  )
}
