import { Button, Label, TextInput } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function AddPromptInput() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [prompt, setPrompt] = useState('')

  const addPrompt = async () => {
    await fetch(`/api/addPrompt?prompt=${prompt}`)
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
        <Button disabled={isPending} onClick={() => startTransition(addPrompt)}>
          Add
        </Button>
      </div>
    </form>
  )
}
