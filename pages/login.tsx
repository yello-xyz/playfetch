import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/server/session'
import { useRouter } from 'next/navigation'
import api from '@/client/api'
import LabeledTextInput from '@/client/labeledTextInput'
import { useState } from 'react'
import PendingButton from '@/client/pendingButton'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  const login = async () => {
    await api.login(email)
    router.refresh()
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <LabeledTextInput
        type='email'
        label='Email'
        placeholder='Enter your email address...'
        value={email}
        setValue={setEmail}
      />
      <PendingButton onClick={login}>Log in</PendingButton>
    </main>
  )
}
