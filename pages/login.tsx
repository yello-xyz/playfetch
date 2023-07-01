import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/server/session'
import api from '@/client/api'
import TextInput from '@/client/textInput'
import { useState } from 'react'
import { PendingButton } from '@/client/button'
import { CheckValidEmail } from '@/common/formatting'
import { signIn } from "next-auth/react"
import ClientRoute from '@/client/clientRoute'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string>()
  const [isPending, setPending] = useState(false)
  const isValidEmail = CheckValidEmail(email)

  const logIn = async () => {
    setPending(true)
    setMessage(undefined)
    const message = await api.login(email)
    setMessage(message)
    setPending(false)
  }

  const onKeyDown = (event: any) => {
    if (event.key === 'Enter' && isValidEmail) {
      logIn()
    }
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <button onClick={() => signIn('github', { callbackUrl: ClientRoute.Home })}>Sign in</button>
      {message && <div className='px-2 py-1 text-xs text-blue-800 bg-blue-200 rounded'>{message}</div>}
      <TextInput
        type='email'
        label='Email'
        placeholder='Please enter your email address...'
        value={email}
        setValue={setEmail}
        onKeyDown={onKeyDown}
      />
      <PendingButton disabled={!isValidEmail || isPending} onClick={logIn}>
        Log in
      </PendingButton>
    </main>
  )
}
