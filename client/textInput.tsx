import { Button, Label, TextInput as FBTextInput } from 'flowbite-react'
import { useState, useTransition } from 'react'

export default function TextInput({
  label,
  placeholder,
  buttonTitle,
  onSubmit,
}: {
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
          value={value}
          onChange={event => setValue(event.target.value)}
          id='input'
          type='text'
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
