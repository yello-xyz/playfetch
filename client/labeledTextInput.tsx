import { Label, TextInput } from 'flowbite-react'
import { HTMLInputTypeAttribute, KeyboardEventHandler } from 'react'

export default function LabeledTextInput({
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
      <TextInput
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
