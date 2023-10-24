import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type GetHeader = (key: string) => string | null

const HTTTPS = 'https'
const GetHost = (getHeader: GetHeader) => getHeader('host') ?? ''
const GetSecureHeader = (getHeader: GetHeader) => getHeader('x-forwarded-proto')?.split(',')?.[0] ?? ''

const IsLocalHost = (getHeader: GetHeader) => GetHost(getHeader).includes('localhost')
const IsSecure = (getHeader: GetHeader) => GetSecureHeader(getHeader) === HTTTPS
const GetSecureURL = (getHeader: GetHeader) => new URL(`${HTTTPS}://${GetHost(getHeader)}`)
const IsCronRequest = (getHeader: GetHeader) => getHeader('x-appengine-cron') === 'true'

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  const getHeader = (key: string) => headers.get(key)

  if (!IsSecure(getHeader) && !IsLocalHost(getHeader) && !IsCronRequest(getHeader)) {
    return NextResponse.redirect(GetSecureURL(getHeader).href, 301)
  } else {
    return NextResponse.next()
  }
}
