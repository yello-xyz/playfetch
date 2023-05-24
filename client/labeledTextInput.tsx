import { Label, TextInput } from 'flowbite-react'
import { HTMLInputTypeAttribute } from 'react'

export default function LabeledTextInput({
  type = 'text',
  label,
  placeholder,
  value,
  setValue,
}: {
  type?: HTMLInputTypeAttribute
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
      <TextInput
        type={type}
        value={value}
        onChange={event => setValue(event.target.value)}
        id='input'
        placeholder={placeholder}
        required={true}
      />
    </div>
  )
}
