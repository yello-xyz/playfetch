import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/server/session'
import { useRouter } from 'next/navigation'
import TextInput from '@/client/textInput'
import api from '@/client/api'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  const router = useRouter()

  const login = async (email: string) => {
    await api.login(email)
    router.refresh()
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <TextInput
        type='email'
        label='Email'
        placeholder='Enter your email address...'
        buttonTitle='Log in'
        onSubmit={login}
      />
    </main>
  )
}
