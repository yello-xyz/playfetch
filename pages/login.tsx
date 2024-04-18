import { withLoggedOutSession } from '@/src/server/session'
import { getCsrfToken, signIn } from 'next-auth/react'
import ClientRoute, { ParseEncodedQuery, ParseNumberQuery } from '@/src/common/clientRoute'
import githubIcon from '@/public/github.svg'
import googleIcon from '@/public/google.svg'
import Icon from '@/src/client/components/icon'
import { useState } from 'react'
import { Capitalize, CheckValidEmail } from '@/src/common/formatting'
import { useRouter } from 'next/router'
import logo from '@/public/logo.svg'
import Image from 'next/image'
import { useDocumentationCookie } from '@/src/client/cookies/cookieBanner'
import { IsGitHubAuthenticationSupported, IsGoogleAuthenticationSupported } from '@/pages/api/auth/[...nextauth]'

export const getServerSideProps = withLoggedOutSession(async context => {
  const tokenCSRF = (await getCsrfToken(context)) ?? null
  const props: LoginProps = {
    tokenCSRF,
    supportsGoogle: IsGoogleAuthenticationSupported(),
    supportsGitHub: IsGitHubAuthenticationSupported(),
  }
  return { props }
})

type LoginProps = { tokenCSRF: string | null; supportsGoogle: boolean; supportsGitHub: boolean }

export default function Login({ tokenCSRF, supportsGoogle, supportsGitHub }: LoginProps) {
  useDocumentationCookie('remove')
  const router = useRouter()
  const { w: joinedWaitList } = ParseNumberQuery(router.query)
  const { e: waitlistEmail, p: waitlistProvider } = ParseEncodedQuery(router.query)

  const [email, setEmail] = useState('')

  return (
    <main className='flex flex-col items-center justify-center h-screen gap-4 p-10 bg-gray-25'>
      <div className='flex flex-col items-center gap-1.5'>
        <Image className='pb-2' width={logo.width} height={logo.height} src={logo.src} alt='logo' />
        <span className='text-sm text-center text-gray-400'>
          {joinedWaitList ? (
            <>
              <p>Thanks for signing up! We’re currently in closed beta,</p>
              <p>but will notify you when we open up more broadly.</p>
              {waitlistEmail?.length && (
                <p className='italic'>
                  Account: {waitlistEmail} {waitlistProvider?.length && <span>({Capitalize(waitlistProvider)})</span>}
                </p>
              )}
            </>
          ) : (
            <>
              <p>Sign in to your PlayFetch account below.</p>
              <p>Don’t have an account? Sign in to join our waitlist…</p>
            </>
          )}
        </span>
      </div>
      <div className='flex flex-col w-full gap-3 p-8 bg-white rounded-lg border border-gray-200 max-w-[450px]'>
        <form className='flex flex-col w-full' method='POST' action='/api/auth/signin/email'>
          {tokenCSRF && <input name='csrfToken' type='hidden' defaultValue={tokenCSRF} />}
          <label className='mb-2 text-sm font-medium text-gray-700' htmlFor='email'>
            Email Address
          </label>
          <input
            className='px-4 py-3 mb-3 text-base text-gray-700 bg-white border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-0 focus:outline-none'
            type='email'
            id='email'
            name='email'
            placeholder='you@example.com'
            required
            value={email}
            onChange={event => setEmail(event.target.value.trim())}
          />
          <button
            className='flex justify-center bg-gray-600 hover:bg-gray-800 p-3.5 rounded-lg text-white disabled:bg-gray-300 text-sm font-medium'
            type='submit'
            disabled={!CheckValidEmail(email)}>
            Sign in with Email
          </button>
        </form>
        {(supportsGoogle || supportsGitHub) && (
          <div className='flex items-center gap-6'>
            <div className='flex-1 h-px bg-gray-200' />
            <span className='py-3 text-sm text-gray-400'>or</span>
            <div className='flex-1 h-px bg-gray-200' />
          </div>
        )}
        {supportsGoogle && <SignInButton name='Google' icon={googleIcon} provider='google' />}
        {supportsGitHub && <SignInButton name='GitHub' icon={githubIcon} provider='github' />}
      </div>
    </main>
  )
}

function SignInButton({ name, icon, provider }: { name: string; icon: string; provider: string }) {
  return (
    <button
      className='flex justify-center p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-200 hover:border-gray-300'
      onClick={() => signIn(provider, { callbackUrl: ClientRoute.Home }).then()}>
      <div className='flex items-center gap-2 text-sm'>
        <Icon className='w-[22px] h-fit' icon={icon} />
        Sign in with {name}
      </div>
    </button>
  )
}
