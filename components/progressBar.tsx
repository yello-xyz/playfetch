import Progress from 'nprogress'
import { Router } from 'next/router'
import { useEffect } from 'react'

Progress.configure({ showSpinner: false })

export default function ProgressBar() {
  useEffect(() => {
    Router.events.on('routeChangeStart', () => Progress.start())
    Router.events.on('routeChangeComplete', () => Progress.done())
    Router.events.on('routeChangeError', () => Progress.done())
    return () => {
      Router.events.off('routeChangeStart', () => Progress.start())
      Router.events.off('routeChangeComplete', () => Progress.done())
      Router.events.off('routeChangeError', () => Progress.done())
    }
  }, [])

  return null
}
