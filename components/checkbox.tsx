import Label from './label'
import toggleOn from '@/public/toggleOn.svg'
import toggleOff from '@/public/toggleOff.svg'
import toggleOnDisabled from '@/public/toggleOnDisabled.svg'
import toggleOffDisabled from '@/public/toggleOffDisabled.svg'
import { ReactNode } from 'react'

export default function Checkbox({
  label,
  id,
  disabled,
  checked,
  setChecked,
  onClick,
  children,
}: {
  label?: string
  id?: string
  disabled?: boolean
  checked: boolean
  setChecked?: (checked: boolean) => void
  onClick?: () => void
  children?: ReactNode
}) {
  const backgroundImage = disabled ? (checked ? toggleOnDisabled : toggleOffDisabled) : checked ? toggleOn : toggleOff
  return (
    <div className='flex items-center justify-between gap-2'>
      {label && (
        <div className='flex flex-col'>
          <Label htmlFor={id}>{label}</Label>
          <label htmlFor={id} className='text-xs text-gray-400'>
            {children}
          </label>
        </div>
      )}
      <input
        className={`w-[42px] h-6 ${!disabled || onClick ? 'cursor-pointer' : ''} appearance-none`}
        style={{ backgroundImage: `url('${backgroundImage.src}')` }}
        type='checkbox'
        id={id}
        disabled={disabled && !onClick}
        checked={checked}
        onChange={event => setChecked?.(event.target.checked)}
        onClick={onClick}
      />
    </div>
  )
}
