import Label from './label'

export default function Checkbox({
  label,
  id,
  disabled,
  checked,
  setChecked,
}: {
  label?: string
  id?: string
  disabled?: boolean
  checked: boolean
  setChecked: (checked: boolean) => void
}) {
  return (
    <div className='flex items-baseline justify-between gap-2'>
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        className={`w-4 h-4 ${disabled ? '' : 'cursor-pointer'}`}
        type='checkbox'
        id={id}
        disabled={disabled}
        checked={checked}
        onChange={event => setChecked(event.target.checked)}
      />
    </div>
  )
}
