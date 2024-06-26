import { Inter } from 'next/font/google'
import 'allotment/dist/style.css'
import 'nprogress/nprogress.css'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import Head from 'next/head'
import { ErrorBoundary } from 'react-error-boundary'
import ClientRoute from '@/src/common/clientRoute'
import TagManager from 'react-gtm-module'
import { useEffect } from 'react'
import CookieBanner from '@/src/client/cookies/cookieBanner'

import dynamic from 'next/dynamic'
const ProgressBar = dynamic(() => import('@/src/client/components/progressBar'), { ssr: false })

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

const escapeHome = () => {
  if (window.location.pathname !== ClientRoute.Home && process.env.NODE_ENV !== 'development') {
    window.open(ClientRoute.Home, '_self')
  }
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useEffect(() => {
    if (!!process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID) {
      TagManager.initialize({ gtmId: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID })
    }
  }, [])

  return (
    <>
      <Head>
        <title>PlayFetch</title>
      </Head>
      <style jsx global>
        {`
          :root {
            --font-inter: ${inter.style.fontFamily};
            --focus-border: #E3E6E9;
            --separator-border: #E3E6E9;
            --focus-border-size: 1px;
          }
        `}
      </style>
      <ErrorBoundary fallbackRender={() => null} onError={escapeHome}>
        <CookieBanner>
          <ProgressBar />
          <SessionProvider session={session}>
            <Component {...pageProps} />
          </SessionProvider>
        </CookieBanner>
      </ErrorBoundary>
    </>
  )
}
