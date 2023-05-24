import { Button, Label, TextInput as FBTextInput } from 'flowbite-react'
import { HTMLInputTypeAttribute, useState, useTransition } from 'react'

export default function TextInput({
  type = 'text',
  label,
  placeholder,
  buttonTitle,
  onSubmit,
}: {
  type?: HTMLInputTypeAttribute
  label: string
  placeholder: string
  buttonTitle: string
  onSubmit: (value: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState('')

  return (
    <form className='flex flex-col self-stretch gap-4'>
      <div>
        <div className='block mb-2'>
          <Label htmlFor='input' value={label} />
        </div>
        <FBTextInput
          type={type}
          value={value}
          onChange={event => setValue(event.target.value)}
          id='input'
          placeholder={placeholder}
          required={true}
        />
      </div>
      <div className='flex'>
        <Button disabled={isPending} onClick={() => startTransition(() => onSubmit(value))}>
          {buttonTitle}
        </Button>
      </div>
    </form>
  )
}
