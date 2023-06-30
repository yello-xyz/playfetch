import { HTMLInputTypeAttribute, KeyboardEventHandler, ReactNode } from 'react'
import Label from './label'

export default function TextInput({
  type = 'text',
  id = 'input',
  label,
  placeholder,
  disabled,
  value,
  setValue,
  onKeyDown,
}: {
  type?: HTMLInputTypeAttribute
  id?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  value: string
  setValue: (value: string) => void
  onKeyDown?: KeyboardEventHandler
}) {
  return (
    <LabelWrapper id={id} label={label}>
      <input
        className='w-full p-2 text-sm bg-white border border-gray-300 rounded-lg'
        type={type}
        disabled={disabled}
        value={value}
        onChange={event => setValue(event.target.value)}
        id={id}
        placeholder={placeholder}
        required
        onKeyDown={onKeyDown}
      />
    </LabelWrapper>
  )
}

function LabelWrapper({ id, label, children }: { id?: string; label?: string; children: ReactNode }) {
  return label ? (
    <div className='flex flex-col gap-1'>
      {label && <Label htmlFor={id}>{label}</Label>}
      {children}
    </div>
  ) : (
    <>{children}</>
  )
}
