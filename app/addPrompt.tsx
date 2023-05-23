'use client'

import { Button, Label, TextInput } from 'flowbite-react'

export default function AddPrompt() {
  return (
    <form className='flex flex-col gap-4'>
      <div>
        <div className='block mb-2'>
          <Label htmlFor='prompt' value='Prompt' />
        </div>
        <TextInput id='prompt' type='text' placeholder='Enter your prompt...' required={true} />
      </div>
      <Button type='submit'>Add</Button>
    </form>
  )
}
