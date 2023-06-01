import { Label, TextInput, Textarea } from 'flowbite-react'
import { HTMLInputTypeAttribute, KeyboardEventHandler } from 'react'

export default function LabeledTextInput({
  type = 'text',
  id = 'input',
  multiline = false,
  label,
  placeholder,
  value,
  setValue,
  onKeyDown,
}: {
  type?: HTMLInputTypeAttribute
  id?: string
  multiline?: boolean
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
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={event => setValue(event.target.value)}
          placeholder={placeholder}
          required={true}
          rows={4}
          onKeyDown={onKeyDown}
        />
      ) : (
        <TextInput
          type={type}
          value={value}
          onChange={event => setValue(event.target.value)}
          id={id}
          placeholder={placeholder}
          required={true}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  )
}
