import { IncomingHttpHeaders } from 'http'

type GetHeader = (key: string) => string | null

const HTTP = 'http'
const HTTTPS = 'https'

const GetHost = (getHeader: GetHeader) => getHeader('host') ?? ''
const GetSecureHeader = (getHeader: GetHeader) => getHeader('x-forwarded-proto')?.split(',')?.[0] ?? ''

export const IsLocalHost = (getHeader: GetHeader) => GetHost(getHeader).includes('localhost')
export const IsSecure = (getHeader: GetHeader) => GetSecureHeader(getHeader) === HTTTPS
export const GetSecureURL = (getHeader: GetHeader) =>  new URL(`${HTTTPS}://${GetHost(getHeader)}`)

function buildURLForClientRoute(clientRoute: string, headers: IncomingHttpHeaders) {
  const getHeader = (key: string) => (headers[key] as string | undefined) ?? null
  const host = GetHost(getHeader)
  const protocol =
    GetSecureHeader(getHeader) || headers.referer?.split('://')[0] || IsLocalHost(getHeader) ? HTTP : HTTTPS

  return `${protocol}://${host}${clientRoute}`
}

export const urlBuilderFromHeaders = (headers: IncomingHttpHeaders) => (path: string) =>
  buildURLForClientRoute(path, headers)
