import { withLoggedOutSession } from '@/src/server/session'
import { getCsrfToken, signIn } from 'next-auth/react'
import ClientRoute from '@/components/clientRoute'
import githubIcon from '@/public/github.svg'
import googleIcon from '@/public/google.svg'
import Icon from '@/components/icon'
import { useState } from 'react'
import { CheckValidEmail } from '@/src/common/formatting'
import Link from 'next/link'

export const getServerSideProps = withLoggedOutSession(async context => {
  const tokenCSRF = (await getCsrfToken(context)) ?? null
  return { props: { tokenCSRF } }
})

export default function Login({ tokenCSRF }: { tokenCSRF: string }) {
  const [email, setEmail] = useState('')

  return (
    <main className={`bg-gray-100 h-screen flex flex-col items-center justify-center gap-6 p-10 font-sans`}>
      <div className='flex flex-col items-center gap-1.5'>
        <span className='text-2xl font-semibold'>Sign in to Play/Fetch</span>
        <span className='text-sm text-gray-600'>
          Don’t have an account?{' '}
          <Link href='mailto:hello@yello.xyz?subject=Join waitlist'>
            <span className='underline'>Join our waitlist</span>
          </Link>
        </span>
      </div>
      <div className='flex flex-col w-full gap-3 p-16 bg-white rounded-lg shadow max-w-[520px]'>
        <form className='flex flex-col w-full' method='POST' action='/api/auth/signin/email'>
          <input name='csrfToken' type='hidden' defaultValue={tokenCSRF} />
          <label className='mb-2 text-sm font-medium text-gray-600' htmlFor='email'>
            Email Address
          </label>
          <input
            className='px-4 py-3 mb-3 text-base text-gray-600 bg-white border border-gray-200 rounded-lg'
            type='email'
            id='email'
            name='email'
            placeholder='you@example.com'
            required
            value={email}
            onChange={event => setEmail(event.target.value.trim())}
          />
          <button
            className='flex justify-center bg-dark-gray-800 hover:bg-black p-3.5 rounded-lg text-white disabled:opacity-30 text-sm font-medium'
            type='submit'
            disabled={!CheckValidEmail(email)}>
            Sign in with Email
          </button>
        </form>
        <div className='flex items-center gap-6'>
          <div className='flex-1 h-px bg-gray-200' />
          <span className='py-3 text-sm text-gray-600'>or</span>
          <div className='flex-1 h-px bg-gray-200' />
        </div>
        <SignInButton name='Google' icon={googleIcon} provider='google' />
        <SignInButton name='Github' icon={githubIcon} provider='github' />
      </div>
    </main>
  )
}

function SignInButton({ name, icon, provider }: { name: string; icon: string; provider: string }) {
  return (
    <button
      className='flex justify-center p-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200'
      onClick={() => signIn(provider, { callbackUrl: ClientRoute.Home }).then()}>
      <div className='flex items-center gap-2'>
        <Icon icon={icon} />
        Sign in with {name}
      </div>
    </button>
  )
}
