import { NextApiRequest, NextApiResponse } from 'next'
import ShortUniqueId from 'short-unique-id'

export function getClientID(req: NextApiRequest, res: NextApiResponse): string {
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

export const CreateEvent = (type: EntityType, parentID: number): Event => ({
  name: 'create_content',
  params: { content_type: type, item_id: parentID.toString() },
})

export default function logUserEvent(req: NextApiRequest, res: NextApiResponse, userID: number, event: Event) {
  const clientID = getClientID(req, res)
  return logEvent(clientID, userID, event)
}

export function logUnknownUserEvent(req: NextApiRequest, res: NextApiResponse, event: Event) {
  const clientID = getClientID(req, res)
  return logEventInternal(clientID, undefined, event)
}

export function logEvent(clientID: string, userID: number, event: Event) {
  return logEventInternal(clientID, userID, event)
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
