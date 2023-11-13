import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '../components/button'
import TagManager from 'react-gtm-module'
import ClientRoute from '@/src/common/clientRoute'
import Checkbox from './checkbox'
import { useCookies } from 'react-cookie'
import { CookieSetOptions } from 'universal-cookie'

const consentCookieName = () => process.env.NEXT_PUBLIC_COOKIE_NAME ?? 'dev-consent'
const topLevelCookieProperties: () => CookieSetOptions = () => ({
  path: '/',
  sameSite: 'lax',
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
})

export const updateCookieConsent = (accept: boolean) => {
  TagManager.dataLayer({ dataLayer: { event: 'update-consent', consent: accept ? 'granted' : 'denied' } })
}

export default function CookieBanner({ children }: any) {
  const [savedCookieStatus, setSavedCookieStatus] = useState(true)
  const [showingMoreOptions, setShowingMoreOptions] = useState(false)
  const [toggledOn, setToggledOn] = useState(false)

  type CookieStatus = 'accepted' | 'denied' | 'unknown'
  const cookieName = consentCookieName()
  const [cookies, setCookie] = useCookies([cookieName])
  const cookieStatus: CookieStatus = cookies[cookieName] ?? 'unknown'
  const updateCookieStatus = useCallback(
    (status: 'accepted' | 'denied') => setCookie(cookieName, status, topLevelCookieProperties()),
    [setCookie, consentCookieName]
  )

  useEffect(() => {
    if (cookieStatus !== 'unknown') {
      updateCookieConsent(cookieStatus === 'accepted')
    } else {
      setTimeout(() => setSavedCookieStatus(false), 2000)
    }
  }, [cookieStatus])

  const updateCookies = (accept: boolean) => () => {
    updateCookieConsent(accept)
    updateCookieStatus(accept ? 'accepted' : 'denied')
    setSavedCookieStatus(true)
  }

  return (
    <div>
      {children}
      {!savedCookieStatus && (
        <div className='fixed z-30 flex flex-col gap-2 p-4 text-gray-700 bg-white rounded-lg shadow bottom-4 left-4 w-[392px]'>
          {showingMoreOptions ? (
            <div className='flex flex-col gap-2 pb-2 text-sm'>
              <Checkbox label='Strictly necessary' checked disabled>
                Essential for the site to function. Always On.
              </Checkbox>
              <Checkbox
                id='analytics'
                label='Analytics'
                checked={toggledOn}
                setChecked={() => setToggledOn(!toggledOn)}>
                Used to measure usage and improve your experience.
              </Checkbox>
            </div>
          ) : (
            <div className='text-xs'>
              We use cookies and similar technologies to give you a better experience and to help us improve our
              services. You can manage your cookie settings at any time. For more information, please see our{' '}
              <Link href={ClientRoute.Privacy}>Privacy Policy</Link>.
            </div>
          )}
          <div className='flex justify-end gap-2'>
            {showingMoreOptions ? (
              <Button type='outline' onClick={updateCookies(toggledOn)}>
                Save
              </Button>
            ) : (
              <Button type='outline' onClick={() => setShowingMoreOptions(true)}>
                More Options
              </Button>
            )}
            <Button onClick={updateCookies(true)}>{showingMoreOptions ? 'Accept All' : 'Accept'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const useDocumentationCookie = (action: 'set' | 'remove') => {
  const cookieName = consentCookieName().startsWith('dev-') ? 'dev-pfda' : 'pfda'
  const [cookies, setCookie, removeCookie] = useCookies([cookieName])
  if (action === 'set' && !cookies[cookieName]) {
    setCookie(cookieName, 'lax', topLevelCookieProperties())
  } else if (action === 'remove' && cookies[cookieName]) {
    removeCookie(cookieName, topLevelCookieProperties())
  }
}
