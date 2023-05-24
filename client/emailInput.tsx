import { Button, Label, TextInput } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function EmailInput() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')

  const addPrompt = async () => {
    await fetch(`/api/login?email=${email}`)
    router.refresh()
  }

  return (
    <form className='flex flex-col gap-4'>
      <div>
        <div className='block mb-2'>
          <Label htmlFor='prompt' value='Prompt' />
        </div>
        <TextInput
          value={email}
          onChange={event => setEmail(event.target.value)}
          id='prompt'
          type='text'
          placeholder='Enter your email address...'
          required={true}
        />
      </div>
      <div className='flex'>
        <Button disabled={isPending} onClick={() => startTransition(addPrompt)}>
          Log in
        </Button>
      </div>
    </form>
  )
}
