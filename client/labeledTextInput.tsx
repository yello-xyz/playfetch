import { Label, TextInput, Textarea } from 'flowbite-react'
import { HTMLInputTypeAttribute } from 'react'

export default function LabeledTextInput({
  type = 'text',
  multiline = false,
  label,
  placeholder,
  value,
  setValue,
}: {
  type?: HTMLInputTypeAttribute
  multiline?: boolean
  label: string
  placeholder: string
  value: string
  setValue: (value: string) => void
}) {
  return (
    <div>
      <div className='block mb-2'>
        <Label htmlFor='input' value={label} />
      </div>
      {multiline ? (
        <Textarea
          id='input'
          value={value}
          onChange={event => setValue(event.target.value)}
          placeholder={placeholder}
          required={true}
          rows={4}
        />
      ) : (
        <TextInput
          type={type}
          value={value}
          onChange={event => setValue(event.target.value)}
          id='input'
          placeholder={placeholder}
          required={true}
        />
      )}
    </div>
  )
}
