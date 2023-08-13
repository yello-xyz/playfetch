import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import 'allotment/dist/style.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
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
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </>
  )
}
