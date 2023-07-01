import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/server/session'
import { signIn } from 'next-auth/react'
import ClientRoute from '@/client/clientRoute'
import Button from '@/client/button'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  return (
    <main className={`flex flex-col gap-4 p-10 items-start ${inter.className}`}>
      <Button onClick={() => signIn('github', { callbackUrl: ClientRoute.Home }).then()}>Log in</Button>
    </main>
  )
}
