import { Label } from 'flowbite-react'
import { HTMLInputTypeAttribute, KeyboardEventHandler } from 'react'

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
    <div>
      {label && (
        <div className='block mb-2'>
          <Label htmlFor={id} value={label} />
        </div>
      )}
      <input
        className='w-full py-2 text-sm bg-white border-gray-300 rounded-lg'
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
