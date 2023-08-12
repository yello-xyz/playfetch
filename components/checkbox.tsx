import Label from './label'
import toggleOn from '@/public/toggleOn.svg'
import toggleOff from '@/public/toggleOff.svg'
import toggleOnDisabled from '@/public/toggleOnDisabled.svg'
import toggleOffDisabled from '@/public/toggleOffDisabled.svg'

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
  setChecked?: (checked: boolean) => void
}) {
  const backgroundImage = disabled ? (checked ? toggleOnDisabled : toggleOffDisabled) : checked ? toggleOn : toggleOff
  return (
    <div className='flex items-center justify-between gap-2'>
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        className={`w-[42px] h-6 ${disabled ? '' : 'cursor-pointer'} appearance-none`}
        style={{ backgroundImage: `url('${backgroundImage.src}')` }}
        type='checkbox'
        id={id}
        disabled={disabled}
        checked={checked}
        onChange={event => setChecked?.(event.target.checked)}
      />
    </div>
  )
}
