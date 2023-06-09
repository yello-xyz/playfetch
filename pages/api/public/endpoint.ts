import { ParseQuery } from '@/client/clientRoute'
import { getEndpoint, getProjectIDFromURLPath } from '@/server/datastore'
import { NextApiRequest, NextApiResponse } from 'next'

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project, endpoint } = ParseQuery(req.query)
  const apiKey = (req.headers['x-api-key'] as string) ?? 'invalid-api-key'

  const projectID = await getProjectIDFromURLPath(project, apiKey)

  if (projectID) {
    const endpointConfig = await getEndpoint(projectID, endpoint)
    return res.json({ endpointConfig })
  } else {
    return res.status(401).json({ error: 'Invalid URL or API Key' })
  }
}

export default endpoint
