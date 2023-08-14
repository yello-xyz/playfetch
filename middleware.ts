import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { GetSecureURL, IsLocalHost, IsSecure } from './src/server/routing'

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  const getHeader = (key: string) => headers.get(key)

  if (!IsSecure(getHeader) && !IsLocalHost(getHeader)) {
    return NextResponse.redirect(GetSecureURL(getHeader).href, 301)
  } else {
    return NextResponse.next()
  }
}
