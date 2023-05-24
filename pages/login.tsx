import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/server/session'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Badge } from 'flowbite-react'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string>()

  const login = async () => {
    setMessage(undefined)
    const message = await api.login(email)
    setMessage(message)
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      {message && <Badge>{message}</Badge>}
      <LabeledTextInput
        type='email'
        label='Email'
        placeholder='Please enter your email address...'
        value={email}
        setValue={setEmail}
      />
      <PendingButton onClick={login}>Log in</PendingButton>
    </main>
  )
}
