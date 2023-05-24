import { Inter } from 'next/font/google'
import { withSession } from '@/server/session'
import { useRouter } from 'next/navigation'
import TextInput from '@/client/textInput'
import api from '@/client/api'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withSession(function getServerSideProps({ req }) {
  if (req.session.user) {
    return { redirect: { destination: '/', permanent: false } }
  } else {
    return { props: { blah: 2 } }
  }
})

export default function Login() {
  const router = useRouter()

  const login = async (email: string) => {
    await api.login(email)
    router.refresh()
  }

  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <TextInput label='Email' placeholder='Enter your email address...' buttonTitle='Log in' onSubmit={login} />
    </main>
  )
}
