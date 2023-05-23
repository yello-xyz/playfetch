'use client'

import { savePrompt } from '@/server/datastore'
import { Button, Label, TextInput } from 'flowbite-react'
import { useState } from 'react'

export default function AddPromptInput() {
  const [prompt, setPrompt] = useState('')

  const addPrompt = async () => {
    await savePrompt(prompt)
  }

  return (
    <form className='flex flex-col gap-4' onSubmit={addPrompt}>
      <div>
        <div className='block mb-2'>
          <Label htmlFor='prompt' value='Prompt' />
        </div>
        <TextInput
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          id='prompt'
          type='text'
          placeholder='Enter your prompt...'
          required={true}
        />
      </div>
      <div className='flex'>
        <Button type='submit'>Add</Button>
      </div>
    </form>
  )
}
