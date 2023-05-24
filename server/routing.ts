import { IncomingHttpHeaders } from 'http'

export function buildURLForClientRoute(clientRoute: string, headers: IncomingHttpHeaders) {
  const host = headers.host ?? ''
  const protocol =
    (headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ||
    headers.referer?.split('://')[0] ||
    (host.startsWith('localhost') ? 'http' : 'https')

  return `${protocol}://${host}${clientRoute}`
}
