import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/server/session'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'
import { Badge } from 'flowbite-react'

const inter = Inter({ subsets: ['latin'] })

const validEmailRegExp =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const checkEmail = (email: string) => !!email.toLowerCase().match(validEmailRegExp)

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string>()
  const [isPending, setPending] = useState(false)
  const isValidEmail = checkEmail(email)

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
      {message && <Badge>{message}</Badge>}
      <LabeledTextInput
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
