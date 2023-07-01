import { Inter } from 'next/font/google'
import { withLoggedOutSession } from '@/server/session'
import { signIn } from 'next-auth/react'
import ClientRoute from '@/client/clientRoute'
import githubIcon from '@/public/github.svg'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

export const getServerSideProps = withLoggedOutSession(() => ({ props: {} }))

export default function Login() {
  return (
    <main className={`bg-gray-100 h-screen flex flex-col items-center justify-center gap-6 p-10 ${inter.className}`}>
      <span className='text-2xl font-semibold'>Sign in to Play/Fetch</span>
      <div className='p-16 bg-white rounded-lg shadow'>
        <button
          className='flex justify-center bg-gray-100 hover:bg-gray-200 w-96 py-3.5 border border-gray-300 rounded'
          onClick={() => signIn('github', { callbackUrl: ClientRoute.Home }).then()}>
          <div className='flex items-center gap-2'>
            <img src={githubIcon.src} className='w-[22px] h-[22px]' />
            Sign in with Github
          </div>
        </button>
      </div>
    </main>
  )
}
