import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/src/server/session'
import { signIn } from 'next-auth/react'
import ClientRoute from '@/components/clientRoute'
import githubIcon from '@/public/github.svg'
import googleIcon from '@/public/google.svg'
import Icon from '@/components/icon'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  return (
    <main className={`bg-gray-100 h-screen flex flex-col items-center justify-center gap-6 p-10 ${inter.className}`}>
      <span className='text-2xl font-semibold'>Sign in to Play/Fetch</span>
      <div className='flex flex-col w-full gap-3 p-16 bg-white rounded-lg shadow max-w-[520px]'>
        <SignInButton name='Google' icon={googleIcon} provider='google' />
        <SignInButton name='Github' icon={githubIcon} provider='github' />
      </div>
    </main>
  )
}

function SignInButton({ name, icon, provider }: { name: string; icon: string; provider: string }) {
  return (
    <button
    className='flex justify-center bg-gray-100 hover:bg-gray-200 p-3.5 border border-gray-300 rounded'
    onClick={() => signIn(provider, { callbackUrl: ClientRoute.Home }).then()}>
    <div className='flex items-center gap-2'>
      <Icon className='w-[22px] h-fit' icon={icon} />
      Sign in with {name}
    </div>
  </button>
  )
}
