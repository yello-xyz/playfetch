import { HTMLInputTypeAttribute, KeyboardEventHandler } from 'react'
import Label from './label'

export default function TextInput({
  type = 'text',
  id = 'input',
  label,
  placeholder,
  value,
  setValue,
  onKeyDown,
}: {
  type?: HTMLInputTypeAttribute
  id?: string
  label?: string
  placeholder?: string
  value: string
  setValue: (value: string) => void
  onKeyDown?: KeyboardEventHandler
}) {
  return (
    <div className='flex flex-col gap-1'>
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        className='w-full p-2 text-sm bg-white border border-gray-300 rounded-lg'
        type={type}
        value={value}
        onChange={event => setValue(event.target.value)}
        id={id}
        placeholder={placeholder}
        required
        onKeyDown={onKeyDown}
      />
    </div>
  )
}
