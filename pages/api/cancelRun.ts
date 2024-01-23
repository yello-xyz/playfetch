import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

const abortControllers = new Map<string, AbortController>()

export const detectRequestClosed = (req: NextApiRequest) => {
  const requestID = req.body.requestID
  const abortController = new AbortController()
  req.on('close', () => {
    requestID && abortControllers.delete(requestID)
    abortController.abort()
  })
  requestID && abortControllers.set(requestID, abortController)
  return abortController
}

async function cancelRun(req: NextApiRequest, res: NextApiResponse) {
  const abortController = req.body.requestID ? abortControllers.get(req.body.requestID) : undefined
  if (abortController && !abortController.signal.aborted) {
    abortController.abort()
  }
  res.json({})
}

export default withLoggedInUserRoute(cancelRun)
