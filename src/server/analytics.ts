import { ServerResponse } from 'http'
import { NextApiRequestCookies } from 'next/dist/server/api-utils'
import ShortUniqueId from 'short-unique-id'

type Request = { cookies: NextApiRequestCookies }
type Response = ServerResponse

export function getClientID(req: Request, res: Response): string {
  const fallbackCookieName = 'fallback_ga'
  const cookieValue = req.cookies['_ga'] ?? req.cookies[fallbackCookieName]
  if (cookieValue) {
    return cookieValue
  }

  const generatedValue = new ShortUniqueId({ length: 16, dictionary: 'number' })()
  res.setHeader('Set-Cookie', `${fallbackCookieName}=${generatedValue}`)
  return generatedValue
}

type Event = { name: string; params: { [key: string]: string | number } }
type EntityType = 'workspace' | 'project' | 'prompt' | 'chain' | 'version' | 'comment' | 'endpoint'

const pageFromURL = (url: string) => {
  const page = url.split('/').slice(-1)[0].split('?')[0]
  return page ? (Number(page).toString() === page ? 'project' : page) : 'home'
}

export const PageLoadEvent = (url: string): Event => ({ name: 'page_load', params: { page: pageFromURL(url) } })

export const SignupEvent = (provider = 'unknown'): Event => ({ name: 'signup', params: { method: provider } })

export const LoginEvent = (provider = 'unknown'): Event => ({ name: 'login', params: { method: provider } })

export const CreateEvent = (type: EntityType, parentID: number): Event => ({
  name: 'create_content',
  params: { content_type: type, item_id: parentID.toString() },
})

export const RunEvent = (
  parentID: number,
  failed: boolean,
  cost: number,
  duration: number,
  origin: 'website' | 'api' = 'website'
): Event => ({
  name: 'run',
  params: { origin, item_id: parentID.toString(), status: failed ? 'error' : 'success', cost, duration },
})

export const EndpointEvent = (parentID: number, failed: boolean, cost: number, duration: number) =>
  RunEvent(parentID, failed, cost, duration, 'api')

export default function logUserRequest(req: Request, res: Response, userID: number, event: Event) {
  const clientID = getClientID(req, res)
  return logUserEvent(clientID, userID, event)
}

export function logUserEvent(clientID: string, userID: number, event: Event) {
  return logEventInternal(clientID, userID, event)
}

export function logUnknownUserRequest(req: Request, res: Response, event: Event) {
  const clientID = getClientID(req, res)
  return logUnknownUserEvent(clientID, event)
}

export function logUnknownUserEvent(clientID: string, event: Event) {
  return logEventInternal(clientID, undefined, event)
}

function logEventInternal(clientID: string, userID: number | undefined, event: Event) {
  const query = new URLSearchParams()
  query.set('measurement_id', process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID ?? '')
  query.set('api_secret', process.env.GOOGLE_ANALYTICS_API_SECRET ?? '')

  fetch(`https://www.google-analytics.com/mp/collect?${query.toString()}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userID?.toString(),
      client_id: clientID,
      non_personalized_ads: true,
      events: [{ name: event.name, params: event.params }],
    }),
  })
}
