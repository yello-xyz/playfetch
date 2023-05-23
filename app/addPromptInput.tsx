'use client'

import { savePrompt } from '@/server/datastore'
import { Button, Label, TextInput } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AddPromptInput() {
  const [prompt, setPrompt] = useState('')
  const router = useRouter()

  const addPrompt = async () => {
    await savePrompt(prompt)
    router.refresh()
  }

  return (
    <form className='flex flex-col gap-4'>
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
        <Button onClick={addPrompt}>
          Add
        </Button>
      </div>
    </form>
  )
}
