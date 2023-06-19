import { getEndpointFromPath } from '@/server/datastore/datastore'
import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from './runPrompt'

async function runTokenizedEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const urlPath = req.body.urlPath
  const projectURLPath = req.body.projectURLPath
  const token = req.body.token
  const inputs = req.body.inputs

  const endpoint = await getEndpointFromPath(urlPath, projectURLPath, token)
  if (token && endpoint) {
    // TODO log output, cost, failures, etc.
    const { output } = await runPromptWithConfig(endpoint.prompt, { ...endpoint.config, inputs })
    return res.json({ output })
  }

  return res.status(401).json(undefined)
}

export default runTokenizedEndpoint
